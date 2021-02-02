/*
     File: MyOpenGLView.h
 Abstract: n/a
  Version: 1.1
 
 Copyright (C) 2013 Apple Inc. All Rights Reserved.
 
 */


#import <Cocoa/Cocoa.h>

@class Scene;


@interface MyOpenGLView : NSOpenGLView
{
    // Model
    Scene *scene;
    
    NSColor *  BGColour;

    // Controller
    IBOutlet NSResponder * controller;
}


- (Scene*) scene;


- (float) cameraDistance;
- (void)  setCameraDistance:(float)newCameraDistance;


- (float) getRotateVert;
- (void)  setRotateVert:(float) newRotateVertAngle;


- (float) getRotateHorz;
- (void)  setRotateHorz:(float) newRotateHorzAngle;


- (NSColor*) getBGColour;
- (void)     setBGColour:(NSColor*) newBGColor;


- (float) getLightAngle;
- (void)  setLightAngle:(float) newLightAngle;


@end
