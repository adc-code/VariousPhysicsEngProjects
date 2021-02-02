/*
     File: MainController.h
 Abstract: n/a
  Version: 1.1
 
 */

#import <Cocoa/Cocoa.h>

#import "ORSSerialPort.h"
#import "FileOutputState.h"
#import "ReachOutputState.h"

@class MyOpenGLView;

@class ORSSerialPortManager;

@class ArduinoConnectWindowController;
@class CalibrateWindowController;
@class OutputDataWindowController;
@class TrackPositionsWindowController;
@class ReachTestWindowController;
@class VisualizationOptionsWindowController;


enum CALIB_DLG_REC_STATE
{
    CALIB_REC_NONE     = -1,
    CALIB_REC_EA_ZERO  =  1,
    CALIB_REC_EA_POS   =  2,
    CALIB_REC_SA_ZERO  =  3,
    CALIB_REC_SA_POS1  =  4,
    CALIB_REC_SA_POS2  =  5,
};


enum SERIAL_DATA_INFO
{
    SERIAL_DATA_NONE  = 0,
    SERIAL_DATA_ORIA  = 1,
    SERIAL_DATA_ORIB  = 2
};

enum CALIB_DLG_REC_STATE  gCalibState;
MyOpenGLView *            gOpenGLView;
NSString *                gOutputDir;
FileOutputState *         gOutputFile;
ReachOutputState *        gReachFile;

unsigned int              gDataRead;
char                      gIncomingDataBuffer [1024];
enum SERIAL_DATA_INFO     gDataElement;



@interface MainController : NSResponder <ORSSerialPortDelegate, NSUserNotificationCenterDelegate>
{
    // Model
    BOOL layerBacked;

    
    // Dialog elements...
    IBOutlet MyOpenGLView * openGLView;
    IBOutlet NSBox        * controlBox;
    IBOutlet NSImageView  * targetImageView;
    IBOutlet NSButton     * traceStopStartBtn;
    
    BOOL     FirstTime_Elbow;
    BOOL     FirstTime_Shoulder;
    
    
    // dialog management...
    ArduinoConnectWindowController       * arduinoConnectWindowController;
    CalibrateWindowController            * calibrateWindowController;
    OutputDataWindowController           * outputDataWindowController;
    TrackPositionsWindowController       * trackPositionsWindowController;
    ReachTestWindowController            * reachTestWindowController;
    VisualizationOptionsWindowController * visualizationOptionsWindowController;
}



//
// Action methods (or callbacks) to handle events when items from the main
// menu were selected.
//
- (IBAction)ArduinoConnectMenuSelected:(id)sender;
- (IBAction)CalibrateMenuSelected:(id)sender;
- (IBAction)OutputDataMenuSelected:(id)sender;
- (IBAction)TrackPositionsMenuSelected:(id)sender;
- (IBAction)ReachTestMenuSelected:(id)sender;
- (IBAction)ModelOptionsMenuSelected:(id)sender;

- (IBAction)CalibDlgEAZeroSelected:(id)sender;
- (IBAction)CalibDlgEAPosSelected:(id)sender;
- (IBAction)CalibDlgSAZeroSelected:(id)sender;
- (IBAction)CalibDlgSAPos1Selected:(id)sender;
- (IBAction)CalibDlgSAPos2Selected:(id)sender;
- (IBAction)CalibDlgFlippedEASelected:(id)sender;
- (IBAction)CalibDlgFlippedSAXSelected:(id)sender;
- (IBAction)CalibDlgFlippedSAYSelected:(id)sender;
- (IBAction)CalibDlgFlippedSAZSelected:(id)sender;
- (IBAction)CalibDlgShoulderDOFsSelected:(id)sender;


- (IBAction)VizDlgAlphaSelected:(id)sender;
- (IBAction)VizDlgArmStyleSelected:(id)sender;
- (IBAction)VizDlgColourSelected:(id)sender;
- (IBAction)VizDlgBGColourSelected:(id)sender;

- (IBAction)OutputDlgPathSelected:(id)sender;
- (IBAction)OutputStartMenuSelected:(id)sender;
- (IBAction)OutputStopMenuSelected:(id)sender;

- (IBAction)ReachTstDlgTargetSelected:(id)sender;
- (IBAction)ReachTstDlgStartRecSelected:(id)sender;
- (IBAction)ReachTstDlgStopRecSelected:(id)sender;
- (IBAction)ReachTstDlgSaveToSelected:(id)sender;
- (IBAction)ReachTstDlgTestTypeSelected:(id)sender;

- (IBAction)TrackPosDlgColourSelected:(id)sender;
- (IBAction)TrackPosDlgStartStopSelected:(id)sender;
- (IBAction)TrackPosDlgClearSelected:(id)sender;
- (IBAction)TrackPosDlgPlotTypeSelected:(id)sender;
- (IBAction)TrackPosDlgDisplayTypeSelected:(id)sender;


@property (strong) NSMutableData * incomingDataBuffer;


- (IBAction)OpenCloseSerialPort:(id) sender;
@property (unsafe_unretained) IBOutlet NSButton * OpenCloseButton;

@property (nonatomic, strong) ORSSerialPort        * serialPort;
@property (nonatomic, strong) ORSSerialPortManager * serialPortManager;
@property (nonatomic, strong) NSArray              * availableBaudRates;


@end
