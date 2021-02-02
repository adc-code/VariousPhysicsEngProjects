//
//  PositionTrace.h
//  MotionTrackingProject
//
//  Created by Dennis Ceh on 2016-04-19.
//
//

#import <Cocoa/Cocoa.h>


@interface PositionTrace : NSObject
{
    NSColor        * colour;
    
    int              nPlotType;
    
    BOOL             displayMode;
    
    BOOL             recordState;
    
    // Lazy implementation... using three arrays instead of one.  Trying to
    // use the NSMutableArray instead of a STL vector
    NSMutableArray * dataPoints_X;
    NSMutableArray * dataPoints_Y;
    NSMutableArray * dataPoints_Z;
}


- init;

- (NSColor*) getColor;
- (void)     setColor:(NSColor*) newColor;

- (int)  getPlotType;
- (void) setPlotType:(int) newType;

- (BOOL) getDisplayMode;
- (void) setDisplayMode:(BOOL) newDisplayMode;

- (BOOL) getRecordState;
- (void) setRecordState:(BOOL) newRecordState;

- (void)   AddPoint:(float [3]) pointData;
- (int)    getNumberPoints;
- (float*) getPoint:(int) index;
- (void)   RemoveAllPoints;

@end
