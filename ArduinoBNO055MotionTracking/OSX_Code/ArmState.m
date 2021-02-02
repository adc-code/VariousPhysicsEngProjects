//
//  ArmState.m
//  MotionTrackingProject
//
//  Created by Dennis Ceh on 2016-04-22.
//
//

#import "ArmState.h"

@implementation ArmState


- init
{
    self = [super init];
    if (self)
    {
        // Init the colour to 'wayne state green'
        colour   = [NSColor colorWithDeviceRed:0.047f green:0.329f blue:0.29f alpha:1.0f];
        alpha    = 1.0;
        armStyle = ARM_STYLE_BOXES;
        
        box_BaseWidth   = 0.3;
        box_BaseHeight  = 1.5;
        box_UpperWidth  = 0.3;
        box_UpperHeight = 1.1;
        box_LowerWidth  = 0.3;
        box_LowerHeight = 1.1;
        
        elbowAngle      =  0;
        shoulderAngleA  = 90;
        shoulderAngleB  = 00;
        
        calibrated_EA   = NO;
        calibrated_SA   = NO;
        
        flipElbowAngle  = NO;
        flipShoulderAngleX = NO;
        flipShoulderAngleY = NO;
        flipShoulderAngleZ = NO;
        numShoulderDOFs  = 3;
        
    }

    return self;
}


- (NSColor*) getColour
{
    return colour;
}


- (void) setColour:(NSColor*) newColour
{
    colour = newColour;
}


- (float) getAlpha
{
    return alpha;
}


- (void) setAlpha:(float) newAlpha
{
    alpha = newAlpha;
}


- (int) getArmStyle
{
    int retVal = 0;
    
    if (armStyle == ARM_STYLE_BOXES)
        retVal = 1;
    else if (armStyle == ARM_STYLE_CYLINDERS)
        retVal = 2;
    else if (armStyle == ARM_STYLE_LINES)
        retVal = 3;
    
    return retVal;
}


- (void) setArmStyle:(int) newArmStyle
{
    if (newArmStyle == 1)
        armStyle = ARM_STYLE_BOXES;
    else if (newArmStyle == 2)
        armStyle = ARM_STYLE_CYLINDERS;
    else if (newArmStyle == 3)
        armStyle = ARM_STYLE_LINES;
}


- (float) getBoxBaseWidth
{
    return box_BaseWidth;
}


- (void) setBoxBaseWidth:(float) newBoxBaseWidth
{
    box_BaseWidth = newBoxBaseWidth;
}


- (float) getBoxBaseHeight
{
    return box_BaseHeight;
}


- (void) setBoxBaseHeight:(float) newBoxBaseHeight
{
    box_BaseHeight = newBoxBaseHeight;
}


- (float) getBoxUpperWidth
{
    return box_UpperWidth;
}


- (void) setBoxUpperWidth:(float) newBoxUpperWidth
{
    box_UpperWidth = newBoxUpperWidth;
}


- (float) getBoxUpperHeight
{
    return box_UpperHeight;
}


- (void) setBoxUpperHeight:(float) newBoxUpperHeight
{
    box_UpperHeight = newBoxUpperHeight;
}


- (float) getBoxLowerWidth
{
    return box_LowerWidth;
}


- (void) setBoxLowerWidth:(float) newBoxLowerWidth
{
    box_LowerWidth = newBoxLowerWidth;
}


- (float) getBoxLowerHeight
{
    return box_LowerHeight;
}


- (void) setBoxLowerHeight:(float) newBoxLowerHeight
{
    box_LowerHeight = newBoxLowerHeight;
}


- (float) getElbowAngle
{
    return elbowAngle;
}


- (void) setElbowAngle:(float) newElbowAngle
{
    elbowAngle = newElbowAngle;
}


- (float) getShoulderAngleA
{
    return shoulderAngleA;
}


- (void) setShoulderAngleA:(float) newShoulderAngleA
{
    shoulderAngleA = newShoulderAngleA;
}


- (float) getShoulderAngleB
{
    return shoulderAngleB;
}


- (void) setShoulderAngleB:(float) newShoulderAngleB
{
    shoulderAngleB = newShoulderAngleB;
}


- (float*) getCalibElbowAngleZero
{
    static float retVal [3];
    
    retVal [0] = calib_ElbowAngleZero [0];
    retVal [1] = calib_ElbowAngleZero [1];
    retVal [2] = calib_ElbowAngleZero [2];
    
    return retVal;
}


- (void) setCalibElbowAngleZero:(float [3]) anglesAtZero
{
    calib_ElbowAngleZero [0] = anglesAtZero [0];
    calib_ElbowAngleZero [1] = anglesAtZero [1];
    calib_ElbowAngleZero [2] = anglesAtZero [2];
}


- (void) findCalibElbowAngleDir:(float [3]) anglesAtPos
{
    for (int i = 0; i < 3; i++)
    {
        if (anglesAtPos [i] - calib_ElbowAngleZero [i] >= 0)
            calib_ElbowAngleSameDir [i] = 1;
        else
            calib_ElbowAngleSameDir [i] = -1;
    }
}


- (float*) findCalibElbowAngle:(float [3]) rawAngles
{
    static float results [3];
    
    for (int i = 0; i < 3; i++)
    {
        results [i] = calib_ElbowAngleSameDir [i] * (rawAngles [i] - calib_ElbowAngleZero [i]);
    }
    
    return results;
}


- (float*) getCalibShoulderAngleZero
{
    static float retVal [3];
    
    retVal [0] = calib_ShoulderAngleZero [0];
    retVal [1] = calib_ShoulderAngleZero [1];
    retVal [2] = calib_ShoulderAngleZero [2];
    
    return retVal;
}


- (void) setCalibShoulderAngleZero:(float [3]) anglesAtZero
{
    calib_ShoulderAngleZero [0] = anglesAtZero [0];
    calib_ShoulderAngleZero [1] = anglesAtZero [1];
    calib_ShoulderAngleZero [2] = anglesAtZero [2];
}


- (void) findCalibShoulderAngleDir1:(float [3]) anglesAtPos1
{
    for (int i = 0; i < 3; i++)
    {
        if (anglesAtPos1 [i] - calib_ShoulderAngleZero [i] >= 0)
            calib_ShoulderAngle1SameDir [i] = -1;
        else
            calib_ShoulderAngle1SameDir [i] = 1;
    }
}


- (void) findCalibShoulderAngleDir2:(float [3]) anglesAtPos2
{
    for (int i = 0; i < 3; i++)
    {
        if (anglesAtPos2 [i] - calib_ShoulderAngleZero [i] >= 0)
            calib_ShoulderAngle2SameDir [i] = -1;
        else
            calib_ShoulderAngle2SameDir [i] = 1;
    }
}


- (float*) findCalibShoulderAngle1:(float [3]) rawAngles
{
    static float results [3];
    
    for (int i = 0; i < 3; i++)
    {
        results [i] = calib_ShoulderAngle1SameDir [i] * (rawAngles [i] - calib_ShoulderAngleZero [i] - 90);
    }
    
    return results;
}


- (float*) findCalibShoulderAngle2:(float [3]) rawAngles
{
    static float results [3];
    
    for (int i = 0; i < 3; i++)
    {
        results [i] = calib_ShoulderAngle2SameDir [i] * (rawAngles [i] - calib_ShoulderAngleZero [i]);
    }
    
    return results;
}


- (float*) getElbowInitQuatValues
{
    static float retVal [4];
    
    retVal [0] = elbowInitQuatValues [0];
    retVal [1] = elbowInitQuatValues [1];
    retVal [2] = elbowInitQuatValues [2];
    retVal [3] = elbowInitQuatValues [3];
    
    return retVal;
}


- (void) setElbowInitQuatValues:(float [4]) newElbowInitQuatValues
{
    for (int i = 0; i < 4; i++)
    {
        elbowInitQuatValues [i] = newElbowInitQuatValues [i];
    }
}


- (float*) getShoulderInitQuatValues
{
    static float retVal [4];
    
    retVal [0] = shoulderInitQuatValues [0];
    retVal [1] = shoulderInitQuatValues [1];
    retVal [2] = shoulderInitQuatValues [2];
    retVal [3] = shoulderInitQuatValues [3];
    
    return retVal;
}


- (void) setShoulderInitQuatValues:(float [4]) newShoulderInitQuatValues
{
    for (int i = 0; i < 4; i++)
    {
        shoulderInitQuatValues [i] = newShoulderInitQuatValues [i];
    }
}


- (float*) getElbowCurrQuatValues
{
    static float retVal [4];
    
    retVal [0] = elbowCurrQuatValues [0];
    retVal [1] = elbowCurrQuatValues [1];
    retVal [2] = elbowCurrQuatValues [2];
    retVal [3] = elbowCurrQuatValues [3];
    
    return retVal;
}


- (void) setElbowCurrQuatValues:(float [4]) newElbowCurrQuatValues
{
    for (int i = 0; i < 4; i++)
    {
        elbowCurrQuatValues [i] = newElbowCurrQuatValues [i];
    }
}


- (float*) getShoulderCurrQuatValues
{
    static float retVal [4];
    
    retVal [0] = shoulderCurrQuatValues [0];
    retVal [1] = shoulderCurrQuatValues [1];
    retVal [2] = shoulderCurrQuatValues [2];
    retVal [3] = shoulderCurrQuatValues [3];
    
    return retVal;
}


- (void) setShoulderCurrQuatValues:(float [4]) newShoulderCurrQuatValues
{
    for (int i = 0; i < 4; i++)
    {
        shoulderCurrQuatValues [i] = newShoulderCurrQuatValues [i];
    }
}


- (float*) getElbowOriAngles
{
    static float retVal [3];
    
    retVal [0] = elbowOriAngles [0];
    retVal [1] = elbowOriAngles [1];
    retVal [2] = elbowOriAngles [2];
    
    return retVal;
}


- (void) setElbowOriAngles:(float [3]) newElbowOriAngles
{
    for (int i = 0; i < 3; i++)
    {
        elbowOriAngles [i] = newElbowOriAngles[i];
    }
}


- (float*) getShoulderOriAngles
{
    static float retVal [3];
    
    retVal [0] = shoulderOriAngles [0];
    retVal [1] = shoulderOriAngles [1];
    retVal [2] = shoulderOriAngles [2];
    
    return retVal;
}


- (void) setShoulderOriAngles:(float [3]) newShoulderOriAngles
{
    for (int i = 0; i < 3; i++)
    {
        shoulderOriAngles [i] = newShoulderOriAngles[i];
    }
}




- (BOOL) getFlipElbowAngle;
{
    return flipElbowAngle;
}


- (void) setFlipElbowAngle:(BOOL) newFlipElbowAngle;
{
    flipElbowAngle = newFlipElbowAngle;
}


- (BOOL) getFlipShoulderAngleX;
{
    return flipShoulderAngleX;
}


- (void) setFlipShoulderAngleX:(BOOL) newFlipShoulderAngleX
{
    flipShoulderAngleX = newFlipShoulderAngleX;
}


- (BOOL) getFlipShoulderAngleY;
{
    return flipShoulderAngleY;
}


- (void) setFlipShoulderAngleY:(BOOL) newFlipShoulderAngleY
{
    flipShoulderAngleY = newFlipShoulderAngleY;
}


- (BOOL) getFlipShoulderAngleZ;
{
    return flipShoulderAngleZ;
}


- (void) setFlipShoulderAngleZ:(BOOL) newFlipShoulderAngleZ;
{
    flipShoulderAngleZ = newFlipShoulderAngleZ;
}


- (int) getShoulderDOFs
{
    return numShoulderDOFs;
}


- (void) setShoulderDOFs:(int) newShoulderDOFs
{
    numShoulderDOFs = newShoulderDOFs;
}


@end
