/*
     File: Scene.h
 Abstract: n/a
  Version: 1.1
 
 Copyright (C) 2013 Apple Inc. All Rights Reserved.
 
 */

#import <Cocoa/Cocoa.h>
#import <OpenGL/gl.h>

#import "ArmState.h"
#import "PositionTrace.h"


@interface Scene : NSObject
{
    // View parameters
    float cameraDistance;
    float lightAngle;
    float viewAngleVert;
    float viewAngleHorz;
    
    // All arm related....
    ArmState       * armState;
    PositionTrace  * positionTrace;
}



- init;
- (ArmState*) armState;
- (PositionTrace*) positionTrace;


- (void)  prepareOpenGL;
- (void)  setViewportRect:(NSRect) viewport;
- (void)  render;

- (float) getElbowAngle;
- (void)  setElbowAngle:(float) newElbowAngle;

- (float) getShoulderAngleA;
- (void)  setShoulderAngleA:(float) newShoulderAngleA;

- (float) getShoulderAngleB;
- (void)  setShoulderAngleB:(float) newShoulderAngleB;

//- (void) setShoulderOriAngles:(float [3]) newShoulderOriAngles;



- (float)cameraDistance;
- (void)setCameraDistance:(float)newCameraDistance;


- (float) getVertViewAngle;
- (void)  setVertViewAngle:(float) newVertViewAngle;

- (float) getHorzViewAngle;
- (void)  setHorzViewAngle:(float) newHorizViewAngle;


- (float) getLightAngle;
- (void)  setLightAngle:(float) newLightAngle;


@end
