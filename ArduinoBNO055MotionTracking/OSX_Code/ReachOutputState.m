//
//  ReachOutputState.m
//  MotionTrackingProject
//
//  Created by Dennis Ceh on 2016-04-24.
//
//

#import "ReachOutputState.h"
#include <sys/time.h>


@implementation ReachOutputState


- init
{
    self = [super init];
    if (self)
    {
        outputFile = NULL;
        basefileName = @"ReachData";
        fileExtension = @"txt";
        
        outputState = NO;
        
        testType = 1;
        targetNumber = 1;
    }
    
    return self;
}


- (void) dealloc
{
    if (outputFile)
        fclose (outputFile);
}


- (NSString*) getBaseFileName
{
    return basefileName;
}


- (void) setBaseFileName:(NSString*) newBaseFileName
{
    basefileName = newBaseFileName;
}


- (NSString*) getFilePath
{
    return filePath;
}


- (void) setFilePath:(NSString*) newFilePath
{
    filePath = newFilePath;
}


- (int) getTestType
{
    return testType;
}


- (void) setTestType:(int) newTestType
{
    testType = newTestType;
}


- (int) getTargetNumber
{
    return targetNumber;
}


- (void) setTargetNumber:(int) newTargetNumber
{
    targetNumber = newTargetNumber;
}


- (BOOL) getOutputState
{
    return outputState;
}


- (void) setOutputState:(BOOL) newState
{
    // if the new state is different to the current state then do something...
    if (outputState != newState)
    {
        outputState = newState;
        
        if (outputState == YES)
        {
            NSDate * currentDate = [NSCalendarDate date];
            NSString * fullFilePath = [NSString stringWithFormat: @"%@/%@_Target%d_Test%d_%@.%@",
                                       filePath, basefileName, targetNumber, testType,
                                       [currentDate descriptionWithCalendarFormat:@"%m-%e-%Y-%I-%M-%S" timeZone:nil locale:nil],
                                       fileExtension];
            
            outputFile = fopen ([fullFilePath UTF8String], "w");
            
            //startTime = time (NULL);
            gettimeofday (&startTime, NULL);
        }
        else
        {
            fclose (outputFile);
        }
    }
}

- (BOOL) writeToFile:(NSString*) lineToWrite
{
    if (outputState == YES)
    {
        //time_t currentTime = time (NULL);
        //long int nSeconds = difftime (currentTime, startTime);
        struct timeval currentTime;
        gettimeofday (&currentTime, NULL);
        
        double dSeconds = ((currentTime.tv_sec * 1000000.0 + currentTime.tv_usec)
                           - (startTime.tv_sec * 1000000.0 + startTime.tv_usec))
                               / 1000000;
        fprintf (outputFile, "%f %s\n", dSeconds, [lineToWrite UTF8String]);
        fflush (outputFile);
    }
    
    return outputState;
}




@end
