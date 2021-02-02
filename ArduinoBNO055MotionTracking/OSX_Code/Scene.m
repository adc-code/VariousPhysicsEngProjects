/*
     File: Scene.m
 Abstract: Encapsulation of a simple openGL-renderable scene.
  Version: 1.1
 
 Copyright (C) 2013 Apple Inc. All Rights Reserved.
 
 */



#import "Scene.h"
#import <OpenGL/glu.h>
#import "PositionTrace.h"

//#include "RobotUtils.h"


static double DegToRad ( double degrees )
{
    return degrees * M_PI / 180.0;
}


@implementation Scene


- init
{
    self = [super init];
    if (self)
    {
        cameraDistance = 6;
        lightAngle     = 235.0;
        viewAngleVert  = 20.0;
        viewAngleHorz  = 235.0;
        
        armState = [[ArmState alloc] init];
        positionTrace = [[PositionTrace alloc] init];
    }
    
    return self;
}


- (void) dealloc
{
    // Note since using automatic reference counting we do not
    // need to manually release or deallocate anything
}


- (ArmState*) armState
{
    return armState;
}


- (PositionTrace*) positionTrace
{
    return positionTrace;
}


- (float)cameraDistance
{
    return cameraDistance;
}


- (void)setCameraDistance:(float)newCameraDistance
{
    cameraDistance = newCameraDistance;
}


- (float) getLightAngle
{
    return lightAngle;
}


- (void) setLightAngle:(float) newLightAngle
{
    lightAngle = newLightAngle;
}


- (float) getElbowAngle
{
    return [armState getElbowAngle];
}


- (void) setElbowAngle:(float) newElbowAngle
{
    [armState setElbowAngle:newElbowAngle];
}


- (float) getShoulderAngleA
{
    return [armState getShoulderAngleA];
}


- (void) setShoulderAngleA:(float) newShoulderAngleA
{
    [armState setShoulderAngleA:newShoulderAngleA];
}


- (float) getShoulderAngleB
{
    return [armState getShoulderAngleB];
}


//- (void) setShoulderOriAngles:(float [3]) newShoulderOriAngles
//[
//]


- (void) setShoulderAngleB:(float) newShoulderAngleB
{
    [armState setShoulderAngleB:newShoulderAngleB];
}


- (float) getVertViewAngle
{
    return viewAngleVert;
}


- (void) setVertViewAngle:(float) newVertViewAngle
{
    viewAngleVert = fabs (newVertViewAngle);
}


- (float) getHorzViewAngle
{
    return viewAngleHorz;
}


- (void) setHorzViewAngle:(float) newHorizViewAngle
{
    viewAngleHorz = fabs (newHorizViewAngle);
}


- (void)setViewportRect:(NSRect) viewport
{
    glViewport ( viewport.origin.x, viewport.origin.y, viewport.size.width, viewport.size.height );

    glMatrixMode ( GL_PROJECTION );
    glLoadIdentity ();
    gluPerspective ( 30, viewport.size.width / viewport.size.height, 0.5, 1000.0 );

    glMatrixMode ( GL_MODELVIEW );
    glLoadIdentity ();
}


- (void) prepareOpenGL
{
    
}



- (void) render
{
    static GLfloat lightDirection[] = { -0.7071, 0.0, 0.7071, 0.0 };
    
    NSColor * armColour = [armState getColour];
    glColor3f([armColour redComponent], [armColour greenComponent], [armColour blueComponent]);
    
    static GLfloat materialDiffuse [4];
    materialDiffuse [0] = [armColour redComponent];
    materialDiffuse [1] = [armColour greenComponent];
    materialDiffuse [2] = [armColour blueComponent];
    materialDiffuse [3] = [armState getAlpha];
    
    static GLfloat materialAmbient [4];
    materialAmbient [0] = materialDiffuse[0] * 0.7;
    materialAmbient [1] = materialDiffuse[1] * 0.7;
    materialAmbient [2] = materialDiffuse[2] * 0.7;
    materialAmbient [3] = materialDiffuse[3];

    // Set up rendering state.
    glEnable ( GL_DEPTH_TEST );
    glEnable ( GL_LIGHTING );
    glEnable ( GL_LIGHT0 );
    glEnable ( GL_BLEND);
    glBlendFunc ( GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA );

    glPushMatrix();

        glMaterialfv ( GL_FRONT_AND_BACK, GL_DIFFUSE, materialDiffuse );
        glMaterialfv ( GL_FRONT_AND_BACK, GL_AMBIENT, materialAmbient );
    
        // Back the camera off a bit.
        glTranslatef ( 0.0, -0.8, -cameraDistance );

        float x = cameraDistance * cos (DegToRad (viewAngleVert)) * cos (DegToRad (viewAngleHorz));
        float y = cameraDistance * sin (DegToRad (viewAngleVert));
        float z = cameraDistance * cos (DegToRad (viewAngleVert)) * sin (DegToRad (viewAngleHorz));

        gluLookAt (x, y, z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

        // Set up our single directional light
        lightDirection [0] = cos ( DegToRad (lightAngle) );
        lightDirection [2] = sin ( DegToRad (lightAngle) );
    
        glLightfv ( GL_LIGHT0, GL_POSITION, lightDirection );
    
        if ([armState getArmStyle] == 1)
            DrawBox ( [armState getBoxBaseWidth], [armState getBoxBaseWidth], [armState getBoxBaseHeight] );
        else if ([armState getArmStyle] == 2)
            DrawCylinder ( [armState getBoxBaseWidth], [armState getBoxBaseWidth], [armState getBoxBaseHeight] );
        else if ([armState getArmStyle] == 3)
            DrawCylinder ( 0.05, 0.05, [armState getBoxBaseHeight] );
    
        glTranslatef ( 0.0f, [armState getBoxBaseHeight], 0.0f );
        glRotatef ( 180, 1.0, 0.0, 0.0f );

        glPushMatrix ();

            float * ShoulderOriAngles = [armState getShoulderOriAngles];
    
            if ([armState getFlipShoulderAngleX])
                ShoulderOriAngles [0] = -1 * ShoulderOriAngles [0];
            if ([armState getFlipShoulderAngleY])
                ShoulderOriAngles [1] = -1 * ShoulderOriAngles [1];
            if ([armState getFlipShoulderAngleZ])
                ShoulderOriAngles [2] = -1 * ShoulderOriAngles [2];

            int numShoulderDOFs = [armState getShoulderDOFs];
            if (numShoulderDOFs == 1)
            {
                glRotatef (ShoulderOriAngles[2], 0, 0, 1);
            }
            else if (numShoulderDOFs == 2)
            {
                glRotatef(ShoulderOriAngles[1], 0, 1, 0);
                glRotatef(ShoulderOriAngles[2], 0, 0, 1);
            }
            else if (numShoulderDOFs == 3)
            {
                glRotatef(ShoulderOriAngles[0], 1, 0, 0);
                glRotatef(ShoulderOriAngles[1], 0, 1, 0);
                glRotatef(ShoulderOriAngles[2], 0, 0, 1);
            }
    
            if ([armState getArmStyle] == 1)
                DrawBox ( [armState getBoxUpperWidth], [armState getBoxUpperWidth], [armState getBoxUpperHeight] );
            else if ([armState getArmStyle] == 2)
                DrawCylinder ( [armState getBoxUpperWidth], [armState getBoxUpperWidth], [armState getBoxUpperHeight] );
            else if ([armState getArmStyle] == 3)
                DrawCylinder ( 0.05, 0.05, [armState getBoxUpperHeight] );
    
            glTranslatef ( 0.0f, [armState getBoxUpperHeight], 0.0f );
            float * ElbowOriAngles = [armState getElbowOriAngles];
            if ([armState getFlipElbowAngle])
                 ElbowOriAngles [0] = -1 * ElbowOriAngles [0];
    
            glRotatef (ElbowOriAngles[0], 1, 0, 0);
    
            if ([armState getArmStyle] == 1)
                DrawBox ( [armState getBoxLowerWidth], [armState getBoxLowerWidth], [armState getBoxLowerHeight] );
            else if ([armState getArmStyle] == 2)
                DrawCylinder ( [armState getBoxLowerWidth], [armState getBoxLowerWidth], [armState getBoxLowerHeight] );
            else if ([armState getArmStyle] == 3)
                DrawCylinder ( 0.05, 0.05, [armState getBoxLowerHeight] );
    
            if ([positionTrace getRecordState] == YES)
            {
                glTranslatef ( 0.0f, [armState getBoxLowerHeight], 0.0f );
                float currTransformation [16];
                glGetFloatv ( GL_MODELVIEW_MATRIX, currTransformation );
                float position [3] = { currTransformation [12], currTransformation [13], currTransformation [14] };
                [positionTrace AddPoint:position];
            }
    
            int traceLength = [positionTrace getNumberPoints];
            if ([positionTrace getDisplayMode] == YES && traceLength > 0)
            {
                glPushMatrix();
                glLoadIdentity();
                glDisable ( GL_COLOR_MATERIAL );
                glDisable ( GL_LIGHTING );
    
                int nPlotType = [positionTrace getPlotType];
                
                if (nPlotType == 0)
                    glBegin (GL_POINTS);
                else if (nPlotType == 1)
                    glBegin (GL_LINE_STRIP);
                
                NSColor * traceColour = [positionTrace getColor];
                glColor3f([traceColour redComponent], [traceColour greenComponent], [traceColour blueComponent]);
                for (int i = 0; i < traceLength; i++)
                {
                    float * data = [positionTrace getPoint:i];
                    glVertex3f (data[0], data[1], data[2]);
                }
                
                glEnd ();
                glPopMatrix();
            }
    
        glPopMatrix ();
    
    glPopMatrix();
    
    // Flush out any unfinished rendering before swapping.
    glFinish ();
}


static void DrawBox (float dx, float dy, float dz)
{
    float dx_2 = 0.5 * dx;
    float dy_2 = 0.5 * dy;
    
    glBegin ( GL_QUADS );
    
        glNormal3f (  0.0f,  0.0f,  1.0f );
        glVertex3f (  dx_2,  0.0f,  dy_2 );
        glVertex3f (  dx_2,    dz,  dy_2 );
        glVertex3f ( -dx_2,    dz,  dy_2 );
        glVertex3f ( -dx_2,  0.0f,  dy_2 );

        glNormal3f (  0.0f,  0.0f, -1.0f );
        glVertex3f (  dx_2,  0.0f, -dy_2 );
        glVertex3f (  dx_2,    dz, -dy_2 );
        glVertex3f ( -dx_2,    dz, -dy_2 );
        glVertex3f ( -dx_2,  0.0f, -dy_2 );

        glNormal3f ( -1.0f,  0.0f,  0.0f );
        glVertex3f (  dx_2,  0.0f,  dy_2 );
        glVertex3f (  dx_2,    dz,  dy_2 );
        glVertex3f (  dx_2,    dz, -dy_2 );
        glVertex3f (  dx_2,  0.0f, -dy_2 );

        glNormal3f (  1.0f,  0.0f,  0.0f );
        glVertex3f ( -dx_2,  0.0f,  dy_2 );
        glVertex3f ( -dx_2,    dz,  dy_2 );
        glVertex3f ( -dx_2,    dz, -dy_2 );
        glVertex3f ( -dx_2,  0.0f, -dy_2 );

        glNormal3f (  0.0f, -1.0f,  0.0f );
        glVertex3f (  dx_2,  0.0f,  dy_2 );
        glVertex3f (  dx_2,  0.0f, -dy_2 );
        glVertex3f ( -dx_2,  0.0f, -dy_2 );
        glVertex3f ( -dx_2,  0.0f,  dy_2 );

        glNormal3f (  0.0f,  1.0f,  0.0f );
        glVertex3f (  dx_2,    dz,  dy_2 );
        glVertex3f (  dx_2,    dz, -dy_2 );
        glVertex3f ( -dx_2,    dz, -dy_2 );
        glVertex3f ( -dx_2,    dz,  dy_2 );
    
    glEnd ();
}


static void DrawCylinder (float dx, float dy, float dz)
{
    float dx_2 = 0.5 * dx;
    float dy_2 = 0.5 * dy;
    
    glPushMatrix ();
    
    GLUquadric *quadric = gluNewQuadric();
    glRotatef (-90, 1, 0, 0);
    gluCylinder (quadric, dx_2, dy_2, dz, 10, 15);
    gluDeleteQuadric( quadric);
    
    quadric = gluNewQuadric ();
    glTranslatef (0, 0, dz);
    gluSphere (quadric, dx*0.75, 10, 10);
    gluDeleteQuadric (quadric);
    
    glPopMatrix ();
}


@end
