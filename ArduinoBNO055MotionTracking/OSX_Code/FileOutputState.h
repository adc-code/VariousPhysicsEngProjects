//
//  FileOutputState.h
//  MotionTrackingProject
//
//  Created by Dennis Ceh on 2016-04-23.
//
//

#import <Cocoa/Cocoa.h>

#include <stdio.h>
#include <time.h>
#include <stdlib.h>


@interface FileOutputState : NSObject
{
    // All of the various parameters to output
    
    NSString * basefileName;
    NSString * filePath;
    NSString * fileExtension;
    
    BOOL outputState;
    
    struct timeval startTime;
    
    FILE * outputFile;
    FILE * outputMatLabFile;
    
    BOOL writeTime;
    BOOL writeOrientationA;
    BOOL writeOrientationB;
    BOOL writeMatlabFile;
}



- init;

- (void) dealloc;



- (NSString*) getBaseFileName;
- (void)      setBaseFileName:(NSString*) newBaseFileName;

- (NSString*) getFilePath;
- (void)      setFilePath:(NSString*) newFilePath;

- (BOOL) getOutputState;
- (void) setOutputState:(BOOL) newState;

- (BOOL) writeToFile:(NSString*) lineToWrite;

//- (void) setWriteTime:(BOOL) writeTimeState;
//- (void) setWriteOrientationA:(BOOL) writeOriAState;
//- (void) setWriteOrientationB:(BOOL) writeOriBState;
//- (void) setWriteMatlabFile:(BOOL) writeMatlab;

@end
