//
//  RobotUtils.c
//  MotionTrackingProject
//
//  Created by Dennis Ceh on 2016-04-28.
//
//


#include "RobotUtils.h"
#include <math.h>


float DegsToRads (float DegAngle)
{
    return DegAngle * M_PI / 180.0;
}



void  ComputeMatrix_FixedRPY (float iR, float iP, float iY, float * Values)
{
    float gamma = DegsToRads (iY);
    float beta  = DegsToRads (iP);
    float alpha = DegsToRads (iR);
    
    Values [0] =  cos (alpha) * cos (beta);
    Values [1] =  sin (alpha) * cos (beta);
    Values [2] = -sin (beta);
    Values [3] =  0.0;
    
    Values [4] =  cos (alpha) * sin (beta) * sin (gamma) - sin (alpha) * cos (gamma);
    Values [5] =  sin (alpha) * sin (beta) * sin (gamma) + cos (alpha) * cos (gamma);
    Values [6] = -cos (beta) * sin (gamma);
    Values [7] =  0.0;

    Values [8] =  cos (alpha) * sin (beta) * cos (gamma) + sin (alpha) * sin (gamma);
    Values [9] =  sin (alpha) * sin (beta) * cos (gamma) - cos (alpha) * sin (gamma);
    Values[10] =  cos (beta) * cos (gamma);
    Values[11] =  0.0;

    Values[12] =  0.0;
    Values[13] =  0.0;
    Values[14] =  0.0;
    Values[15] =  1.0;
    
}


