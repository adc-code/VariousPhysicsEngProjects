//
//  ArmState.h
//  MotionTrackingProject
//
//  Created by Dennis Ceh on 2016-04-22.
//
//

#import <Foundation/Foundation.h>


enum ARM_STYLE
{
    ARM_STYLE_BOXES      = 1,
    ARM_STYLE_CYLINDERS  = 2,
    ARM_STYLE_LINES      = 3
};


@interface ArmState : NSObject
{
    // Arm attributes... should be a separate file
    NSColor  * colour;
    float      alpha;
    
    enum ARM_STYLE    armStyle;
    float  box_BaseWidth;
    float  box_BaseHeight;
    float  box_UpperWidth;
    float  box_UpperHeight;
    float  box_LowerWidth;
    float  box_LowerHeight;
    
    float elbowAngle;
    float shoulderAngleA;
    float shoulderAngleB;
    
    BOOL  calibrated_EA;
    BOOL  calibrated_SA;
    
    float calib_ElbowAngleZero [3];
    int   calib_ElbowAngleSameDir [3];
    
    float elbowOriAngles [3];
    float shoulderOriAngles [3];
    
    float calib_ShoulderAngleZero [3];
    int   calib_ShoulderAngle1SameDir [3];
    int   calib_ShoulderAngle2SameDir [3];
    
    float elbowInitQuatValues    [4];
    float shoulderInitQuatValues [4];
    float elbowCurrQuatValues    [4];
    float shoulderCurrQuatValues [4];
    
    
    BOOL  flipElbowAngle;
    BOOL  flipShoulderAngleX;
    BOOL  flipShoulderAngleY;
    BOOL  flipShoulderAngleZ;
    int   numShoulderDOFs;
    
}

- init;

- (NSColor*) getColour;
- (void)     setColour:(NSColor*) newColour;

- (float) getAlpha;
- (void)  setAlpha:(float) newAlpha;

- (int)  getArmStyle;
- (void) setArmStyle:(int) newArmStyle;


- (float) getBoxBaseWidth;
- (void)  setBoxBaseWidth:(float) newBoxBaseWidth;

- (float) getBoxBaseHeight;
- (void)  setBoxBaseHeight:(float) newBoxBaseHeight;


- (float) getBoxUpperWidth;
- (void)  setBoxUpperWidth:(float) newBoxUpperWidth;

- (float) getBoxUpperHeight;
- (void)  setBoxUpperHeight:(float) newBoxUpperHeight;


- (float) getBoxLowerWidth;
- (void)  setBoxLowerWidth:(float) newBoxLowerWidth;

- (float) getBoxLowerHeight;
- (void)  setBoxLowerHeight:(float) newBoxLowerHeight;


- (float) getElbowAngle;
- (void)  setElbowAngle:(float) newElbowAngle;

- (float) getShoulderAngleA;
- (void)  setShoulderAngleA:(float) newShoulderAngleA;

- (float) getShoulderAngleB;
- (void)  setShoulderAngleB:(float) newShoulderAngleB;


- (float*) getCalibElbowAngleZero;
- (void)   setCalibElbowAngleZero:(float [3]) anglesAtZero;

- (void)   findCalibElbowAngleDir:(float [3]) anglesAtPos;
- (float*) findCalibElbowAngle:(float [3]) rawAngles;


- (float*) getCalibShoulderAngleZero;
- (void)   setCalibShoulderAngleZero:(float [3]) anglesAtZero;

- (void)   findCalibShoulderAngleDir1:(float [3]) anglesAtPos1;
- (void)   findCalibShoulderAngleDir2:(float [3]) anglesAtPos2;
- (float*) findCalibShoulderAngle1:(float [3]) rawAngles;
- (float*) findCalibShoulderAngle2:(float [3]) rawAngles;

- (float*) getElbowOriAngles;
- (void)   setElbowOriAngles:(float [3]) newElbowOriAngles;

- (float*) getShoulderOriAngles;
- (void)   setShoulderOriAngles:(float [3]) newShoulderOriAngles;


- (float*) getElbowInitQuatValues;
- (void)   setElbowInitQuatValues:(float [4]) newElbowInitQuatValues;

- (float*) getShoulderInitQuatValues;
- (void)   setShoulderInitQuatValues:(float [4]) newShoulderInitQuatValues;

- (float*) getElbowCurrQuatValues;
- (void)   setElbowCurrQuatValues:(float [4]) newElbowCurrQuatValues;

- (float*) getShoulderCurrQuatValues;
- (void)   setShoulderCurrQuatValues:(float [4]) newShoulderCurrQuatValues;

- (BOOL) getFlipElbowAngle;
- (void) setFlipElbowAngle:(BOOL) newFlipElbowAngle;

- (BOOL) getFlipShoulderAngleX;
- (void) setFlipShoulderAngleX:(BOOL) newFlipShoulderAngleX;

- (BOOL) getFlipShoulderAngleY;
- (void) setFlipShoulderAngleY:(BOOL) newFlipShoulderAngleY;

- (BOOL) getFlipShoulderAngleZ;
- (void) setFlipShoulderAngleZ:(BOOL) newFlipShoulderAngleZ;

- (int)  getShoulderDOFs;
- (void) setShoulderDOFs:(int) newShoulderDOFs;



@end
