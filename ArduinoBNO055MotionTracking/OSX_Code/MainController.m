/*
     File: MainController.m
 Abstract: The main controller that handles user interaction.
  Version: 1.1
 
 
 Copyright (C) 2013 Apple Inc. All Rights Reserved.
 
 */

#import "MainController.h"
#import "MyOpenGLView.h"
#import "Scene.h"
#import "ArmState.h"

#import <OpenGL/OpenGL.h>

#import "ORSSerialPort.h"
#import "ORSSerialPortManager.h"

#import "ArduinoConnectWindowController.h"
#import "CalibrateWindowController.h"
#import "OutputDataWindowController.h"
#import "TrackPositionsWindowController.h"
#import "ReachTestWindowController.h"
#import "VisualizationOptionsWindowController.h"


// should really put this somewhere else...
#define ORIENTATION_A  @"OA:"
#define ORIENTATION_B  @"OB:"

#define ASCII_CHAR_TAB      9
#define ASCII_CHAR_LF      10
#define ASCII_CHAR_CR      13
#define ASCII_CHAR_SPACE   32

#define INPUT_BUFFER_MAX  256



@implementation MainController


- (void) awakeFromNib
{
    // Make the OpenGL View layer-backed.
    if (openGLView != nil)
        gOpenGLView = openGLView;
    
    [openGLView setWantsLayer:YES];
    
    if (gOutputFile == nil)
        gOutputFile = [[FileOutputState alloc] init];
    
    if (gReachFile == nil)
        gReachFile = [[ReachOutputState alloc] init];
        
    //
    // Serial port related
    //
    self.serialPortManager = [ORSSerialPortManager sharedSerialPortManager];
    self.availableBaudRates = @[@300, @1200, @2400, @4800, @9600, @14400, @19200,
                                @28800, @38400, @57600, @115200, @230400];
    
    // add OSX notifications to inform the user when something was added to the port
    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
    [nc addObserver:self selector:@selector(serialPortsWereConnected:) name:ORSSerialPortsWereConnectedNotification object:nil];
    [nc addObserver:self selector:@selector(serialPortsWereDisconnected:) name:ORSSerialPortsWereDisconnectedNotification object:nil];
    
    [[NSUserNotificationCenter defaultUserNotificationCenter] setDelegate: self];
    
    _incomingDataBuffer = [[NSMutableData alloc] init];
    gDataRead = 0;
    
    FirstTime_Elbow    = YES;
    FirstTime_Shoulder = YES;
}


- (void)dealloc
{
    // Note removing notif. observer that was added in awakeFromNib
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}



- (void)toggleControlBox
{
    if ([controlBox superview] != openGLView)
    {
        // Determine desired start and end positions for animating the controlBox into view.
        NSRect bounds = [openGLView bounds];
        NSPoint endOrigin = NSMakePoint(0.5 * (NSWidth(bounds) - NSWidth([controlBox frame])), 24.0);
        NSPoint startOrigin = NSMakePoint(endOrigin.x, -NSHeight([controlBox frame]));

        // Position the controlBox outside the openGLView's bounds, and make it initially fully transparent.
        [controlBox setFrameOrigin:startOrigin];
        [openGLView addSubview:controlBox];
        [controlBox setAlphaValue:0.0];

        // Now animate the controlBox into view and simultaneously fade it in.
        [NSAnimationContext beginGrouping];
        [[NSAnimationContext currentContext] setDuration:0.5];
        [[controlBox animator] setAlphaValue:1.0];
        [[controlBox animator] setFrameOrigin:endOrigin];
        [NSAnimationContext endGrouping];
    }
    else
    {
        //if ([controlBox superview] == openGLView)
        // Remove the controlBox from the view tree.
        [controlBox removeFromSuperview];
    }
}

#pragma mark *** Property Accessors ***



#pragma mark *** Event Handling ***

- (void)keyDown:(NSEvent *)event
{
    //Scene *scene = [openGLView scene];
    unichar c = [[event charactersIgnoringModifiers] characterAtIndex:0];
    switch (c)
    {
        // [space] toggle displaying the control box
        case 32:
            [self toggleControlBox];
            break;

        default:
            break;
    }
}


- (void) mouseDown:(NSEvent *)theEvent
{
    // Currently do nothing...
}


//
// Serial port connect/disconnect notifications
//
- (void)serialPortsWereConnected:(NSNotification *)notification
{
    NSArray *connectedPorts = [notification userInfo][ORSConnectedSerialPortsKey];
    
    [self postUserNotificationForConnectedPorts:connectedPorts];
}


- (void) postUserNotificationForConnectedPorts:(NSArray *) connectedPorts
{
    // Note: uses the 'User Notification Center' functionality to display a nice
    // popup message to inform the user that a new serial port device has been connected
    // to the computer.  note that this functionality is only available from OSX 10.7
    // onwards; older versions will get an error compiling.
    
    if (!NSClassFromString (@"NSUserNotificationCenter")) return;
    
    NSUserNotificationCenter * unc = [NSUserNotificationCenter defaultUserNotificationCenter];
    for (ORSSerialPort * port in connectedPorts)
    {
        NSUserNotification * userNote = [[NSUserNotification alloc] init];
        userNote.title = NSLocalizedString (@"Serial Port Connected", @"Serial Port Connected");
        NSString *informativeTextFormat = NSLocalizedString (@"Serial Port %@ was connected to your Mac.", @"Serial port connected user notification informative text");
        userNote.informativeText = [NSString stringWithFormat:informativeTextFormat, port.name];
        userNote.soundName = nil;
        
        [unc deliverNotification:userNote];
    }
}


- (void)serialPortsWereDisconnected:(NSNotification *)notification
{
    NSArray *disconnectedPorts = [notification userInfo][ORSDisconnectedSerialPortsKey];
    
    [self postUserNotificationForDisconnectedPorts:disconnectedPorts];
}


- (void)postUserNotificationForDisconnectedPorts:(NSArray *)disconnectedPorts
{
    // Note: uses the 'User Notification Center' functionality to display a nice
    // popup message to inform the user that a new serial port device has been connected
    // to the computer.  note that this functionality is only available from OSX 10.7
    // onwards; older versions will get an error compiling.
    
    if (!NSClassFromString(@"NSUserNotificationCenter")) return;
    
    NSUserNotificationCenter *unc = [NSUserNotificationCenter defaultUserNotificationCenter];
    for (ORSSerialPort *port in disconnectedPorts)
    {
        NSUserNotification *userNote = [[NSUserNotification alloc] init];
        userNote.title = NSLocalizedString(@"Serial Port Disconnected", @"Serial Port Disconnected");
        NSString *informativeTextFormat = NSLocalizedString(@"Serial Port %@ was disconnected from your Mac.", @"Serial port disconnected user notification informative text");
        userNote.informativeText = [NSString stringWithFormat:informativeTextFormat, port.name];
        userNote.soundName = nil;
        
        [unc deliverNotification:userNote];
    }
}


- (BOOL)userNotificationCenter:(NSUserNotificationCenter*) center
     shouldPresentNotification:(NSUserNotification*) notification
{
    // Not sure if there is some sort of thread synchronization problem here, but
    // this is being done to force the display of notifications...
    return YES;
}


- (void)userNotificationCenter:(NSUserNotificationCenter *)center didDeliverNotification:(NSUserNotification *)notification
{
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, 3.0 * NSEC_PER_SEC);
    dispatch_after (popTime, dispatch_get_main_queue(), ^(void)
    {
        [center removeDeliveredNotification:notification];
    });
}


- (void)setSerialPort:(ORSSerialPort*) port
{
    // setSerialPort: called when the serial port popup has a selection
    
    if (port != _serialPort)
    {
        [_serialPort close];
        
        _serialPort = port;
        
        _serialPort.delegate = self;
    }
}


- (void)serialPortWasRemovedFromSystem:(ORSSerialPort*) serialPort
{
    if (serialPort != _serialPort)
    {
        [_serialPort close];
        
        _serialPort = serialPort;
    }
}



- (void)serialPort:(ORSSerialPort*) serialPort didReceiveData:(NSData*) data
{
    [self.incomingDataBuffer appendData:data];
    if ([self.incomingDataBuffer length] > INPUT_BUFFER_MAX)
    {
        NSString * tmpBuffer = [[NSString alloc] initWithData:self.incomingDataBuffer encoding:NSUTF8StringEncoding];
        NSArray  * tmpTokens = [tmpBuffer componentsSeparatedByString:@" "];
        
        int numTokens = [tmpTokens count];
        int oriAIndex = -1;
        int oriBIndex = -1;
        float orientationAValues [3];
        float orientationBValues [3];
        for (int i = 0; i < numTokens; i++)
        {
            NSString * tmpString = [tmpTokens objectAtIndex:i];
            if ([tmpString isEqualToString:ORIENTATION_A])
            {
                oriAIndex = i;
                continue;
            }

            if ([tmpString isEqualToString:ORIENTATION_B])
            {
                oriBIndex = i;
                continue;
            }

            if ((oriAIndex > 0) && ((oriAIndex+3) < [tmpTokens count]) &&
                (oriBIndex > 0) && ((oriBIndex+3) < [tmpTokens count]) )
            {
                for (int i = 0; i < 3; i++)
                {
                    orientationAValues [i] = [[tmpTokens objectAtIndex:(oriAIndex + i)] floatValue];
                    orientationBValues [i] = [[tmpTokens objectAtIndex:(oriBIndex + i)] floatValue];
                }
                
                
            }
        }
        
        //[self.incomingDataBuffer setLength:0];
        //[self.incomingDataBuffer resetBytesInRange:NSMakeRange(0, [self.incomingDataBuffer length])];
    }
    
    NSLog (@"buffer length = %d", [self.incomingDataBuffer length]);
    
    NSString * inputString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    
    NSArray * tokens = [inputString componentsSeparatedByString:@" "];
    
    BOOL  haveOrientA = NO;
    float orientationAValues [3];
    int   orientationAValueObtained = -1;
    BOOL  haveOrientB = NO;
    float orientationBValues [3];
    int   orientationBValueObtained = -1;

    BOOL  OrientAValid = NO;
    BOOL  OrientBValid = NO;
    
    NSNumberFormatter *f = [[NSNumberFormatter alloc] init];
    
    for (int i = 0; i < [tokens count]; i++)
    {
        if ([[tokens objectAtIndex:i] isEqualToString:ORIENTATION_A])
        {
            haveOrientA = YES;
            continue;
        }
        else if ([[tokens objectAtIndex:i] isEqualToString:ORIENTATION_B])
        {
            haveOrientB = YES;
            continue;
        }
        
        if (haveOrientA)
        {
            NSString * tmpStr = [tokens objectAtIndex:i];
            
            if ([f numberFromString:[tokens objectAtIndex:i]] && [tmpStr length] >= 4)
            {
                orientationAValueObtained++;
                orientationAValues [orientationAValueObtained] = [[tokens objectAtIndex:i] floatValue];
                
                if (orientationAValueObtained == 2)
                {
                    Scene * scene = [gOpenGLView scene];
                    ArmState * armState = [ scene armState ];
                    
                    float * zeroPos = [armState getCalibShoulderAngleZero];
                    
                    float deltaOri [3];
                    deltaOri [0] = orientationAValues[0] - zeroPos[0];
                    deltaOri [1] = orientationAValues[1] - zeroPos[1];
                    deltaOri [2] = orientationAValues[2] - zeroPos[2];
                    
                    [armState setShoulderOriAngles:deltaOri];
                    
                    orientationAValueObtained = -1;
                    haveOrientA = NO;
                    OrientAValid = YES;
                    [gOpenGLView setNeedsDisplay:YES];
                    
                    if (gCalibState == CALIB_REC_SA_ZERO)
                    {
                        ArmState * armState = [ scene armState ];
                        [ armState setCalibShoulderAngleZero:orientationAValues ];
                        gCalibState = CALIB_REC_NONE;
                    }
                    else if (gCalibState == CALIB_REC_SA_POS1)
                    {
                        ArmState * armState = [ scene armState ];
                        [ armState findCalibShoulderAngleDir1:orientationAValues ];
                        gCalibState = CALIB_REC_NONE;
                    }
                    /* removed for now...
                    else if (gCalibState == CALIB_REC_SA_POS2)
                    {
                        ArmState * armState = [ scene armState ];
                        gCalibState = CALIB_REC_NONE;
                    } */
                }
                continue;
            }
        }
        
        if (haveOrientB)
        {
            NSString * tmpStr = [tokens objectAtIndex:i];
            
            if ([f numberFromString:[tokens objectAtIndex:i]] && [tmpStr length] >= 4)
            {
                orientationBValueObtained++;
                orientationBValues [orientationBValueObtained] = [[tokens objectAtIndex:i] floatValue];
                
                if (orientationBValueObtained == 2)
                {
                    Scene * scene = [gOpenGLView scene];
                    ArmState * armState = [ scene armState ];
                    float * zeroPos = [armState getCalibElbowAngleZero];
                    
                    float deltaOri [3];
                    deltaOri [0] = orientationBValues[0] - zeroPos[0];
                    deltaOri [1] = orientationBValues[1] - zeroPos[1];
                    deltaOri [2] = orientationBValues[2] - zeroPos[2];
                    
                    [armState setElbowOriAngles:deltaOri];
             
                    orientationBValueObtained = -1;
                    haveOrientB = NO;
                    OrientBValid = YES;
                    [gOpenGLView setNeedsDisplay:YES];
                    
                    if (gCalibState == CALIB_REC_EA_ZERO)
                    {
                        ArmState * armState = [ scene armState ];
                        [ armState setCalibElbowAngleZero:orientationBValues ];
                        gCalibState = CALIB_REC_NONE;
                    }
                    else if (gCalibState == CALIB_REC_EA_POS)
                    {
                        ArmState * armState = [ scene armState ];
                        [ armState findCalibElbowAngleDir:orientationBValues ];
                        gCalibState = CALIB_REC_NONE;
                    }
                    
                }
            }
        }
        
        if (OrientAValid && OrientBValid)
        {
            //NSLog(@"%@", [[NSDate date] timeIntervalSince1970]);
            //NSLog (@" OrientationA %f %f %f    OrientationB %f %f %f",
            //       orientationAValues [0], orientationAValues [1], orientationAValues [2],
            //       orientationBValues [0], orientationBValues [1], orientationBValues [2]);
            OrientAValid = NO;
            OrientBValid = NO;

            NSString *str = [NSString stringWithFormat: @"OrientationA %f %f %f  OrientationB %f %f %f",
                             orientationAValues [0], orientationAValues [1], orientationAValues [2],
                             orientationBValues [0], orientationBValues [1], orientationBValues [2]];
            [gOutputFile writeToFile:str];
            
            [gReachFile writeToFile:str];
            
            [gOpenGLView setNeedsDisplay:YES];
        }
        
    }
}


- (void)serialPortWasOpened:(ORSSerialPort*) port
{
    _OpenCloseButton.title = @"Close";
}


- (void)serialPortWasClosed:(ORSSerialPort*) port
{
    _OpenCloseButton.title = @"Open";
}



- (IBAction)ArduinoConnectMenuSelected:(id)sender
{
    // Callback to handle event when the 'Setup -> Arduino Connect' menu item was
    // selected.  Used to bring up the dialog...
    
    if (!arduinoConnectWindowController)
    {
        arduinoConnectWindowController = [[ArduinoConnectWindowController alloc] initWithWindowNibName:@"ArduinoConnectWindowController"];
    }
    
    [arduinoConnectWindowController showWindow:self];
    
    _serialPort.numberOfStopBits = 1;
    _serialPort.parity = ORSSerialPortParityNone;
    _serialPort.delegate = self;
}


- (IBAction)CalibrateMenuSelected:(id)sender
{
    // Callback to handle event when the 'Setup -> Calibrate' menu item was
    // selected.  Used to bring up the dialog...
    
    if (!calibrateWindowController)
    {
        calibrateWindowController = [[CalibrateWindowController alloc] initWithWindowNibName:@"CalibrateWindowController"];
    }
    
    [calibrateWindowController showWindow:self];
}


- (IBAction)TrackPositionsMenuSelected:(id)sender
{
    // Callback to handle event when the 'Motion Tracking -> Track Positions' menu item was
    // selected.  Used to bring up the dialog...
    
    if (!trackPositionsWindowController)
    {
        trackPositionsWindowController = [[TrackPositionsWindowController alloc] initWithWindowNibName:@"TrackPositionsWindowController"];
    }
    
    [trackPositionsWindowController showWindow:self];
}


- (IBAction)ReachTestMenuSelected:(id)sender
{
    // Callback to handle event when the 'Motion Tracking -> Reach Test' menu item was
    // selected.  Used to bring up the dialog...
    
    if (!reachTestWindowController)
    {
        reachTestWindowController = [[ReachTestWindowController alloc] initWithWindowNibName:@"ReachTestWindowController"];
    }
    
    if (targetImageView == nil)
    {
        NSRect rect = NSMakeRect (10, 10, 400, 300);
        targetImageView = [[NSImageView alloc] initWithFrame:rect];
        [targetImageView setImageScaling:NSScaleToFit];

        NSImage * img = [NSImage imageNamed:@"IMG_target1.png"];
        [targetImageView setImage:img];

    }
    [reachTestWindowController showWindow:self];
}

- (IBAction)ModelOptionsMenuSelected:(id)sender
{
    // Callback to handle event when the 'Motion Tracking -> Reach Test' menu item was
    // selected.  Used to bring up the dialog...
    
    if (!visualizationOptionsWindowController)
    {
        visualizationOptionsWindowController = [[VisualizationOptionsWindowController alloc] initWithWindowNibName:@"VisualizationOptionsWindowController"];
    }
    
    [visualizationOptionsWindowController showWindow:self];
}


- (IBAction)OutputDataMenuSelected:(id)sender
{
    // Callback to handle event when the 'Setup -> Calibrate' menu item was
    // selected.  Used to bring up the dialog...
    
    if (!outputDataWindowController)
    {
        outputDataWindowController = [[OutputDataWindowController alloc] initWithWindowNibName:@"OutputDataWindowController"];
    }
    
    [outputDataWindowController showWindow:self];
}


- (IBAction)OpenCloseSerialPort:(id)sender
{
    // OpenCloseSerialPort : is called when the open/close button has been pressed
    
    if (_serialPort.isOpen)
    {
        // If the serial port was open then close it...
        [_serialPort close];
        
        [_OpenCloseButton setTitle:@"Open"];
    }
    else
    {
        // If the serial port was closed then open it...
        [_serialPort open];
        
        _serialPort.numberOfStopBits = 1;
        _serialPort.parity = ORSSerialPortParityNone;
        
        [_OpenCloseButton setTitle:@"Close"];
    }
}

- (IBAction)CalibDlgEAZeroSelected:(id)sender
{
    gCalibState = CALIB_REC_EA_ZERO;
}


- (IBAction)CalibDlgEAPosSelected:(id)sender;
{
    gCalibState = CALIB_REC_EA_POS;
}


- (IBAction)CalibDlgSAZeroSelected:(id)sender
{
    gCalibState = CALIB_REC_SA_ZERO;
}


- (IBAction)CalibDlgSAPos1Selected:(id)sender
{
    gCalibState = CALIB_REC_SA_POS1;
}


- (IBAction)CalibDlgSAPos2Selected:(id)sender
{
    gCalibState = CALIB_REC_SA_POS2;
}


- (IBAction) CalibDlgFlippedEASelected:(id)sender
{
    Scene * scene = [gOpenGLView scene];
    ArmState * armState = [ scene armState ];

    BOOL flipEA = NO;
    if ([sender state] == NSOnState)
        flipEA = YES;
    
    [armState setFlipElbowAngle:flipEA];
    
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)CalibDlgFlippedSAXSelected:(id)sender
{
    Scene * scene = [gOpenGLView scene];
    ArmState * armState = [ scene armState ];
    
    BOOL flipSAX = NO;
    if ([sender state] == NSOnState)
        flipSAX = YES;
    
    [armState setFlipShoulderAngleX:flipSAX];
    
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)CalibDlgFlippedSAYSelected:(id)sender
{
    Scene * scene = [gOpenGLView scene];
    ArmState * armState = [ scene armState ];
    
    BOOL flipSAY = NO;
    if ([sender state] == NSOnState)
        flipSAY = YES;
    
    [armState setFlipShoulderAngleY:flipSAY];
    
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)CalibDlgFlippedSAZSelected:(id)sender
{
    Scene * scene = [gOpenGLView scene];
    ArmState * armState = [ scene armState ];
    
    BOOL flipSAZ = NO;
    if ([sender state] == NSOnState)
        flipSAZ = YES;
    
    [armState setFlipShoulderAngleZ:flipSAZ];
    
    [gOpenGLView setNeedsDisplay:YES];
}



- (IBAction)CalibDlgShoulderDOFsSelected:(id)sender
{
    Scene * scene = [gOpenGLView scene];
    ArmState * armState = [ scene armState ];
    
    [armState setShoulderDOFs:[sender tag]];
    
    [gOpenGLView setNeedsDisplay:YES];
}



- (IBAction)VizDlgColourSelected:(id)sender
{
    NSColorWell * colorWell = sender;
    NSColor * pickedColour = [colorWell color];
    
    Scene * scene = [gOpenGLView scene];
    ArmState * armState = [ scene armState ];
    [armState setColour:pickedColour];
    
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)VizDlgBGColourSelected:(id)sender
{
    NSColorWell * colorWell = sender;
    NSColor * pickedColour = [colorWell color];
    
    [gOpenGLView setBGColour:pickedColour];
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)VizDlgAlphaSelected:(id)sender
{
    float alpha = [sender floatValue];
    
    Scene * scene = [gOpenGLView scene];
    ArmState * armState = [ scene armState ];
    [armState setAlpha:alpha];
    
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)VizDlgArmStyleSelected:(id)sender;
{
    int armStyle = [sender selectedTag];
    
    Scene * scene = [gOpenGLView scene];
    ArmState * armState = [ scene armState ];
    [armState setArmStyle:armStyle];

    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)TrackPosDlgColourSelected:(id)sender
{
    NSColorWell * colorWell = sender;
    NSColor * pickedColour = [colorWell color];
    
    Scene * scene = [gOpenGLView scene];
    PositionTrace * posTrace = [scene positionTrace];
    [posTrace setColor:pickedColour];
    
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)TrackPosDlgStartStopSelected:(id)sender
{
    Scene * scene = [gOpenGLView scene];
    
    PositionTrace * posTrace = [scene positionTrace];
    
    BOOL currRecState = [posTrace getRecordState];
    
    if (currRecState == NO)
    {
        // If its 'stop'...
        [traceStopStartBtn setTitle:@"Stop"];
        
        [posTrace setRecordState:YES];
        
    }
    else
    {
        // If its 'start'...
        [traceStopStartBtn setTitle:@"Start"];

        [posTrace setRecordState:NO];
    }
}


- (IBAction)TrackPosDlgClearSelected:(id)sender
{
    Scene * scene = [gOpenGLView scene];
    
    PositionTrace * posTrace = [scene positionTrace];
    
    [posTrace RemoveAllPoints];
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)TrackPosDlgPlotTypeSelected:(id)sender
{
    Scene * scene = [gOpenGLView scene];
    
    PositionTrace * posTrace = [scene positionTrace];

    int nSelected = [sender tag];
    [posTrace setPlotType:nSelected];
    
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)TrackPosDlgDisplayTypeSelected:(id)sender
{
    Scene * scene = [gOpenGLView scene];
    
    PositionTrace * posTrace = [scene positionTrace];
    
    BOOL displayMode = YES;
    if ([sender state] == NSOffState)
        displayMode = NO;
    
    [posTrace setDisplayMode:displayMode];
    
    [gOpenGLView setNeedsDisplay:YES];
}


- (IBAction)OutputDlgPathSelected:(id)sender
{
    // create the save panel
    NSOpenPanel *panel = [NSOpenPanel openPanel];
    
    //[panel showsTagField:NO];
    [panel setCanChooseFiles:NO];
    [panel setCanChooseDirectories:YES];
    [panel setAllowsMultipleSelection:NO];
    [panel setCanCreateDirectories:YES];
    
    int panelState = [panel runModal];
    if (panelState == NSOKButton)
    {
        // NSLog (@"OutputDlgPathSelected we have an OK button");
    }
    else if (panelState == NSCancelButton)
    {
        // NSLog (@"OutputDlgPathSelected we have a Cancel button");
        return;
    }
    else
    {
        // NSLog (@"OutputDlgPathSelected tvarInt not equal 1 or zero = %3d", panelState);
        return;
    } // end if
    
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [gOutputFile setFilePath:[panel directory]];
    #pragma clang diagnostic pop
}


- (IBAction)OutputStartMenuSelected:(id)sender
{
    [gOutputFile setOutputState:YES];
}


- (IBAction)OutputStopMenuSelected:(id)sender
{
    [gOutputFile setOutputState:NO];
}


- (IBAction)ReachTstDlgTargetSelected:(id)sender
{
    int nTargetSelected = [sender tag];
    
    [gReachFile setTargetNumber:nTargetSelected];
    
    if (nTargetSelected == 1)
    {
        NSImage * img = [NSImage imageNamed:@"IMG_target1.png"];
        [targetImageView setImage:img];
    }
    else if (nTargetSelected == 2)
    {
        NSImage * img = [NSImage imageNamed:@"IMG_target2.png"];
        [targetImageView setImage:img];
    }
    else if (nTargetSelected == 3)
    {
        NSImage * img = [NSImage imageNamed:@"IMG_target3.png"];
        [targetImageView setImage:img];
    }
    else if (nTargetSelected == 4)
    {
        NSImage * img = [NSImage imageNamed:@"IMG_target4.png"];
        [targetImageView setImage:img];
    }
    
}

- (IBAction)ReachTstDlgStartRecSelected:(id)sender
{
    [gReachFile setOutputState:YES];
}


- (IBAction)ReachTstDlgStopRecSelected:(id)sender
{
    [gReachFile setOutputState:NO];
}


- (IBAction)ReachTstDlgSaveToSelected:(id)sender
{
    // create the save panel
    NSOpenPanel *panel = [NSOpenPanel openPanel];
    
    //[panel showsTagField:NO];
    [panel setCanChooseFiles:NO];
    [panel setCanChooseDirectories:YES];
    [panel setAllowsMultipleSelection:NO];
    [panel setCanCreateDirectories:YES];
    
    int panelState = [panel runModal];
    if (panelState == NSOKButton)
    {
        // NSLog(@"OutputDlgPathSelected we have an OK button");
    }
    else if (panelState == NSCancelButton)
    {
        // NSLog(@"OutputDlgPathSelected we have a Cancel button");
        return;
    }
    else
    {
        // NSLog(@"OutputDlgPathSelected tvarInt not equal 1 or zero = %3d", panelState);
        return;
    } // end if
    
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [gReachFile setFilePath:[panel directory]];
    #pragma clang diagnostic pop
}


- (IBAction)ReachTstDlgTestTypeSelected:(id)sender
{
    int nTestType = [sender selectedTag];
    
    [gReachFile setTestType:nTestType];
}



@end


