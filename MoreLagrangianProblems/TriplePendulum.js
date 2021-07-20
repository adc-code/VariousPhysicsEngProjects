//
// isCanvasSupported: used to check if the browser supports the canvas
//
function isCanvasSupported ()
{
    var elem = document.createElement ('canvas');
    return !!(elem.getContext && elem.getContext ('2d'));
}

        
//
// canvasApp: the main canvas application
//
function canvasApp ()
{
    if (!isCanvasSupported())
    {
        return;
    }


    //
    // drawScreen: draws one simulation update cycle
    //
    function drawScreen ()
    {
        // draw the canvas or simulation area
        context.fillStyle = '#EEEEEE';
        context.fillRect (0, 0, theCanvas.width, theCanvas.height);

        // draw the walls
        context.strokeStyle = '#000000'; 
        context.strokeRect (1,  1, theCanvas.width-2, theCanvas.height-2);
		
        if (_SimState == SIM_STATE_PLAY)
        {
            updateCalcs ();

            if ( Math.abs (_dPrevTheta1 - _dTheta1) < ZERO_TOLERANCE && 
                 Math.abs (_dPrevTheta2 - _dTheta2) < ZERO_TOLERANCE &&
                 Math.abs (_dPrevTheta2 - _dTheta3) < ZERO_TOLERANCE )
            {
                _SimState = SIM_STATE_STOP;
                document.getElementById ('StartBtn').innerHTML = 'Start';

                SetParamsValues (false);

                DisableUI (false);
                clearTimeout (_SimTimerId);
            } 
        }

        redrawSceen ();
    }


    //
    // SolveEquationsOfMotion: compute the angle accelerations, that is theta double dot,
    //                         inorder to determine the state of the system.  Note that all
    //                         of the elements were computed by the lagrangian of the system.
    // 
    function SolveEquationsOfMotion (iStateVec)
    {
        // extract 
        var omega1 = iStateVec[0];
        var omega2 = iStateVec[1];
        var omega3 = iStateVec[2];
 
        var theta1 = iStateVec[3];
        var theta2 = iStateVec[4];
        var theta3 = iStateVec[5];

        // Create a three by three matrix with the necessary elements
        // note that the matrix is symmetrical about the diagonal so we don't need to compute
        // all the the elements
        var m11 = (_dMass1 + _dMass2 + _dMass3) * _dLength1 * _dLength1;
        var m12 = (_dMass2 + _dMass3) * _dLength1 * _dLength2 * Math.cos (theta1 - theta2);
        var m13 = _dMass3 * _dLength1 * _dLength3 * Math.cos (theta1 - theta3);

        var m21 = m12;
        var m22 = (_dMass2 + _dMass3) * _dLength2 * _dLength2;
        var m23 = _dMass3 * _dLength2 * _dLength3 * Math.cos (theta2 - theta3);

        var m31 = m13;
        var m32 = m23;
        var m33 = _dMass3 * _dLength3 * _dLength3;

        // Actually we are not computing the matrix, rather the inverse of the matrix
        var mInv = math.inv ( [ [m11, m12, m13], [m21, m22, m23], [m31, m32, m33] ] );

        var f1 = -1 * (_dMass2 + _dMass3) * _dLength1 * _dLength2 * Math.sin (theta1 - theta2) * omega2 * omega2
                 - _dMass3 * _dLength1 * _dLength3 * Math.sin (theta1 - theta3) * omega3 * omega3
                 - (_dMass1 + _dMass2 + _dMass3) * _dGravityConst * _dLength1 * Math.sin (theta1);
        var f2 = (_dMass2 + _dMass3) * _dLength1 * _dLength2 * Math.sin (theta1 - theta2) * omega1 * omega1
                 - _dMass3 * _dLength2 * _dLength3 * Math.sin (theta2 - theta3) * omega3 * omega3
                 - (_dMass2 + _dMass3) * _dGravityConst * _dLength2 * Math.sin (theta2);
        var f3 = _dMass3 * _dLength1 * _dLength3 * Math.sin (theta1 - theta3) * omega1 * omega1
                 + _dMass3 * _dLength2 * _dLength3 * Math.sin (theta2 - theta3) * omega2 * omega2
                 - _dMass3 * _dGravityConst * _dLength3 * Math.sin (theta3);

        // This damping is just a very slight approximation
        f1 -= _dDampingConst * omega1;
        f2 -= _dDampingConst * omega2;
        f2 -= _dDampingConst * omega3;

        // Make a matrix of the stuff of the 'remaining stuff' from the lagrangian
        var F = math.matrix ( [f1, f2, f3] );

        // Compute theta double dot...
        var thetaDDot = math.multiply (mInv, F);

        // Uncomment for debugging...
        // console.log (thetaDDot._data[0], thetaDDot._data[1], f1, f2);

        return [ thetaDDot._data[0], thetaDDot._data[1], thetaDDot._data[2], omega1, omega2, omega3 ];
    }


    //
    // MakeStateVector... utility function used to create the state vector for a particular
    //                    step of the runge kutta calculation
    //
    function MakeStateVector (iStateVec, iKVec, iMultiplier)
    {
        var results = [];
        for (var i = 0; i < 6; i++)
            results.push (iStateVec[i] + iMultiplier * iKVec[i] * _dTimeStep);
      
        return results;
    }


    //
    // RK4_step: perform one step of the Runge Kutta solution...
    //
    function RK4_step (iStateVec)
    {
        var k1 = SolveEquationsOfMotion ( iStateVec )
        var k2 = SolveEquationsOfMotion ( MakeStateVector(iStateVec, k1, 0.5) );
        var k3 = SolveEquationsOfMotion ( MakeStateVector(iStateVec, k2, 0.5) );
        var k4 = SolveEquationsOfMotion ( MakeStateVector(iStateVec, k3, 1) );

        var results = [];
        for (var i = 0; i < 6; i++)
            results.push ( _dTimeStep * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]) / 6 );

        return results;
    }


    //
    // update: updates the positions for all the balls
    //
    function updateCalcs ()
    {
        _dPrevTheta1 = _dTheta1;
        _dPrevTheta2 = _dTheta2;
        _dPrevTheta3 = _dTheta3;

        var simStepResults = RK4_step ( [_dOmega1, _dOmega2, _dOmega3, _dTheta1, _dTheta2, _dTheta3] );

        _dOmega1 += simStepResults[0];
        _dOmega2 += simStepResults[1];
        _dOmega3 += simStepResults[2];

        _dTheta1 += simStepResults[3];
        _dTheta2 += simStepResults[4];
        _dTheta3 += simStepResults[5];

        // uncomment for debugging
        // console.log (_dTheta1, _dTheta2, _dTheta3); //, _dOmega1, _dOmega2, _dOmega3);
    }


    //
    // render: used to draw the elements to the canvas
    //
    function redrawSceen () 
    {
        var cnvsWidth  = theCanvas.width;
        var cnvsHeight = theCanvas.height;

        var boxWidth  = cnvsWidth / 5;
        var boxHeight = cnvsHeight / 25;

        var xPos1 = _dLength1 * Math.sin (_dTheta1);
        var yPos1 = _dLength1 * Math.cos (_dTheta1);

        var xPos2 = xPos1 + _dLength2 * Math.sin (_dTheta2);
        var yPos2 = yPos1 + _dLength2 * Math.cos (_dTheta2);

        var xPos3 = xPos2 + _dLength3 * Math.sin (_dTheta3);
        var yPos3 = yPos2 + _dLength3 * Math.cos (_dTheta3);

        var xOrigin = cnvsWidth/2;
        var yOrigin = boxHeight*3;
        
        context.fillStyle = '#666666';
        context.fillRect ((cnvsWidth - boxWidth) / 2, boxHeight  * 2, boxWidth, boxHeight);

        if (_DrawTrail)
        {
            _TrailPoints.push ( [ [xPos1, yPos1], [xPos2, yPos2], [xPos3, yPos3] ] );
            while (_TrailPoints.length > _nTrailLength)
            { 
                _TrailPoints.shift ();
            }
            
            var startIndex = 2;
            if (_nTrailType == 2)
                startIndex = 0;

            for (var i = startIndex; i < 3; i++)
            {
                context.beginPath();
                context.moveTo (xOrigin + _TrailPoints[0][i][0], yOrigin + _TrailPoints[0][i][1]);
                for (var j = 1; j < _TrailPoints.length; j++)
                {
                    context.strokeStyle = _TrailColours[i];
                    context.lineTo (xOrigin + _TrailPoints[j][i][0], yOrigin + _TrailPoints[j][i][1]);
                }
                context.stroke ();
            }
        }

        // lines and outlines are black
        context.strokeStyle = '#000';

        // the 'links' of the pendulum
        context.beginPath();
        context.moveTo (xOrigin, yOrigin);
        context.lineTo (xOrigin + xPos1, yOrigin + yPos1);
        context.lineTo (xOrigin + xPos2, yOrigin + yPos2);
        context.lineTo (xOrigin + xPos3, yOrigin + yPos3);
        context.stroke ();

        // anchor point
        context.fillStyle = '#cccccc';
        context.beginPath ();
        context.arc (xOrigin, yOrigin, BALL_RADIUS, 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();

        // masses
        for (var i = 0; i < 3; i++)
        {
            context.fillStyle = _BallColours [i];
            context.beginPath ();

            var xPos = 0;
            var yPos = 0;
            var rad  = 1;
            if (i == 0)
            {
                xPos = xOrigin + xPos1;
                yPos = yOrigin + yPos1;
                rad  = BALL_RADIUS * Math.sqrt (_dMass1);
            }
            else if (i == 1)
            {
                xPos = xOrigin + xPos2;
                yPos = yOrigin + yPos2;
                rad  = BALL_RADIUS * Math.sqrt (_dMass2);
            }
            else if (i == 2)
            {
                xPos = xOrigin + xPos3;
                yPos = yOrigin + yPos3;
                rad  = BALL_RADIUS * Math.sqrt (_dMass3);
            }

            context.arc (xPos, yPos, rad, 0, 2*Math.PI, true);
            context.closePath ();
            context.fill ();
            context.stroke ();
        }
    }
	

    //
    // DisableUI: Used to enable/disable the UI so parameters can't be changed during 
    //            the simulation
    //
    function DisableUI (iState)
    {
        document.getElementById ('ResetBtn').disabled = iState;
        if (iState == true)                    
            document.getElementById ('ResetBtn').classList = ['button disabledbutton'];
        else
            document.getElementById ('ResetBtn').classList = ['button enabledbutton'];

        document.getElementById ('initSpeed1Slider').disabled = iState;
        document.getElementById ('initSpeed1Output').disabled = iState;

        document.getElementById ('initSpeed2Slider').disabled = iState;
        document.getElementById ('initSpeed2Output').disabled = iState;

        document.getElementById ('initSpeed3Slider').disabled = iState;
        document.getElementById ('initSpeed3Output').disabled = iState;

        document.getElementById ('initAngle1Slider').disabled = iState;
        document.getElementById ('initAngle1Output').disabled = iState;

        document.getElementById ('initAngle2Slider').disabled = iState;
        document.getElementById ('initAngle2Output').disabled = iState;

        document.getElementById ('initAngle3Slider').disabled = iState;
        document.getElementById ('initAngle3Output').disabled = iState;

        document.getElementById ('mass1Slider').disabled      = iState;
        document.getElementById ('mass1Output').disabled      = iState;

        document.getElementById ('mass2Slider').disabled      = iState;
        document.getElementById ('mass2Output').disabled      = iState;

        document.getElementById ('mass3Slider').disabled      = iState;
        document.getElementById ('mass3Output').disabled      = iState;

        document.getElementById ('length1Slider').disabled    = iState;
        document.getElementById ('length1Output').disabled    = iState;

        document.getElementById ('length2Slider').disabled    = iState;
        document.getElementById ('length2Output').disabled    = iState;

        document.getElementById ('length3Slider').disabled    = iState;
        document.getElementById ('length3Output').disabled    = iState;

        document.getElementById ('dampingSlider').disabled    = iState;
        document.getElementById ('dampingOutput').disabled    = iState;

        document.getElementById ('gravitySlider').disabled    = iState;
        document.getElementById ('gravityOutput').disabled    = iState;
    }


    //
    // OnStartButtonClick: callback to handle the start/top button
    //
    function OnStartButtonClick ()
    {
        if (_SimState == SIM_STATE_STOP)
        {
            // If STOPPED go to PLAY state

            _SimState = SIM_STATE_PLAY;
            document.getElementById ('StartBtn').innerHTML = 'Stop';

            DisableUI (true);

            // Start the simulation
            _SimTimerId = setInterval (drawScreen, 20);
        }
        else if (_SimState == SIM_STATE_PLAY)
        {
            // if PLAYING go to STOP state

            _SimState = SIM_STATE_STOP;
            document.getElementById ('StartBtn').innerHTML = 'Start';

            SetParamsValues (false); 
            DisableUI (false);

            // Stop the simulation 
            clearTimeout (_SimTimerId);
        }
    }


    //
    // SetParamsValues: used to update the UI and key state variables to the desired states
    //
    function SetParamsValues (iUseDefaults)
    {
        if (iUseDefaults == true)
        {
            // First the variables...
            _dTheta1       = DEFAULT_INITANGLE_1;
            _dTheta2       = DEFAULT_INITANGLE_2;
            _dTheta3       = DEFAULT_INITANGLE_3;

            _dOmega1       = DEFAULT_INITSPEED_1;
            _dOmega2       = DEFAULT_INITSPEED_2;
            _dOmega3       = DEFAULT_INITSPEED_2;

            _dDampingConst = DEFAULT_DAMPINGCONST;
            _dGravityConst = DEFAULT_GRAVITYCONST;

            _dLength1      = DEFAULT_LENGTH_1;
            _dLength2      = DEFAULT_LENGTH_2;
            _dLength2      = DEFAULT_LENGTH_3;

            _dMass1        = DEFAULT_MASS_1;
            _dMass2        = DEFAULT_MASS_2;
            _dMass3        = DEFAULT_MASS_2;
        }
 
        _dPrevTheta1 = 999;
        _dPrevTheta2 = 999;

        // Then the UI elements...
        document.getElementById ('initSpeed1Slider').value  = _dOmega1;
        document.getElementById ('initSpeed1Output').value  = (_dOmega1 * 180 / Math.PI).toFixed (1);

        document.getElementById ('initSpeed2Slider').value  = _dOmega2;
        document.getElementById ('initSpeed2Output').value  = (_dOmega2 * 180 / Math.PI).toFixed (1);

        document.getElementById ('initSpeed3Slider').value  = _dOmega3;
        document.getElementById ('initSpeed3Output').value  = (_dOmega3 * 180 / Math.PI).toFixed (1);

        document.getElementById ('initAngle1Slider').value  = _dTheta1 * 180 / Math.PI;
        document.getElementById ('initAngle1Output').value  = (_dTheta1 * 180 / Math.PI).toFixed (1) + '°';

        document.getElementById ('initAngle2Slider').value  = _dTheta2 * 180 / Math.PI;
        document.getElementById ('initAngle2Output').value  = (_dTheta2 * 180 / Math.PI).toFixed (1) + '°';

        document.getElementById ('initAngle3Slider').value  = _dTheta3 * 180 / Math.PI;
        document.getElementById ('initAngle3Output').value  = (_dTheta3 * 180 / Math.PI).toFixed (1) + '°';

        document.getElementById ('length1Slider').value     = _dLength1 * MAX_LENGTH / _dMaxLength;
        document.getElementById ('length1Output').value     = (_dLength1 * MAX_LENGTH / _dMaxLength).toFixed (0);

        document.getElementById ('length2Slider').value     = _dLength2 * MAX_LENGTH / _dMaxLength;
        document.getElementById ('length2Output').value     = (_dLength2 * MAX_LENGTH / _dMaxLength).toFixed (0);

        document.getElementById ('length3Slider').value     = _dLength3 * MAX_LENGTH / _dMaxLength;
        document.getElementById ('length3Output').value     = (_dLength3 * MAX_LENGTH / _dMaxLength).toFixed (0);

        document.getElementById ('mass1Slider').value       = _dMass1;
        document.getElementById ('mass1Output').value       = _dMass1;
        
        document.getElementById ('mass2Slider').value       = _dMass2;
        document.getElementById ('mass2Output').value       = _dMass2;

        document.getElementById ('mass3Slider').value       = _dMass3;
        document.getElementById ('mass3Output').value       = _dMass3;

        document.getElementById ('dampingSlider').value     = _dDampingConst;
        document.getElementById ('dampingOutput').value     = _dDampingConst;

        document.getElementById ('gravitySlider').value     = _dGravityConst;
        document.getElementById ('gravityOutput').value     = _dGravityConst;

        document.getElementById ('ResetBtn').disabled       = false; 
    }


    //
    // OnResetButtonClick: callback to handle the start/top button
    //
    function OnResetButtonClick ()
    {
        if (document.getElementById ('ResetBtn').disabled == false)
        {
            SetParamsValues (true);

            _TrailPoints = [];

            drawScreen ();
        }
    }


    //
    // OnInitSpeed1SliderChange: callback to handle changes with the initial speed slider for angle 1
    //
    function OnInitSpeed1SliderChange ()
    {
        _dOmega1 = +document.getElementById ('initSpeed1Slider').value;
        document.getElementById ('initSpeed1Output').value = (_dOmega1 * 180 / Math.PI).toFixed (1);
    }

   
    //
    // OnInitSpeedSliderChange: callback to handle changes with the initial speed slider for angle 2
    //
    function OnInitSpeed2SliderChange ()
    {
        _dOmega2 = +document.getElementById ('initSpeed2Slider').value;
        document.getElementById ('initSpeed2Output').value = (_dOmega2 * 180 / Math.PI).toFixed (1);
    }

   
    //
    // OnInitSpeedSliderChange: callback to handle changes with the initial speed slider for angle 3
    //
    function OnInitSpeed3SliderChange ()
    {
        _dOmega3 = +document.getElementById ('initSpeed3Slider').value;
        document.getElementById ('initSpeed3Output').value = (_dOmega3 * 180 / Math.PI).toFixed (1);
    }

   
    // 
    // OnInitAngle1SliderChange: callback to handle changes with the initial angle slider
    //
    function OnInitAngle1SliderChange ()
    {
        var angle = document.getElementById ('initAngle1Slider').value;
        document.getElementById ('initAngle1Output').value = angle + '°';

        _dTheta1 = angle / 180 * Math.PI;

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    // 
    // OnInitAngle2SliderChange: callback to handle changes with the initial angle slider for teh second angle
    //
    function OnInitAngle2SliderChange ()
    {
        var angle = document.getElementById ('initAngle2Slider').value;
        document.getElementById ('initAngle2Output').value = angle + '°';

        _dTheta2 = angle / 180 * Math.PI;

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    // 
    // OnInitAngle3SliderChange: callback to handle changes with the initial angle slider for the third angle
    //
    function OnInitAngle3SliderChange ()
    {
        var angle = document.getElementById ('initAngle3Slider').value;
        document.getElementById ('initAngle3Output').value = angle + '°';

        _dTheta3 = angle / 180 * Math.PI;

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    //
    // OnLength1SliderChange: callback to handle changes with the length 1 slider
    //
    function OnLength1SliderChange ()
    {
        var dLength = document.getElementById ('length1Slider').value;
        _dLength1 = _dMaxLength * dLength / MAX_LENGTH;

        document.getElementById ('length1Output').value = dLength;

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    //
    // OnLength2SliderChange: callback to handle changes with the length 2 slider
    //
    function OnLength2SliderChange ()
    {
        var dLength = document.getElementById ('length2Slider').value;
        _dLength2 = _dMaxLength * dLength / MAX_LENGTH;

        document.getElementById ('length2Output').value = dLength;

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    //
    // OnLength3SliderChange: callback to handle changes with the length 3 slider
    //
    function OnLength3SliderChange ()
    {
        var dLength = document.getElementById ('length3Slider').value;
        _dLength3 = _dMaxLength * dLength / MAX_LENGTH;

        document.getElementById ('length2Output').value = dLength;

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    //
    // OnMass1SliderChange: callback to handle changes to the upper mass
    //
    function OnMass1SliderChange ()
    {
        _dMass1 = +document.getElementById ('mass1Slider').value;
        document.getElementById ('mass1Output').value = _dMass1;

        drawScreen ();
    }


    //
    // OnMass2SliderChange: callback to handle changes to the second mass
    //
    function OnMass2SliderChange ()
    {
        _dMass2 = +document.getElementById ('mass2Slider').value;
        document.getElementById ('mass2Output').value = _dMass2;

        drawScreen ();
    }


    //
    // OnMass3SliderChange: callback to handle changes to the lower mass
    //
    function OnMass3SliderChange ()
    {
        _dMass3 = +document.getElementById ('mass3Slider').value;
        document.getElementById ('mass3Output').value = _dMass2;

        drawScreen ();
    }


    //
    // OnDampingSliderChange: callback to handle changes with the dampling slider
    //
    function OnDampingSliderChange ()
    {
        _dDampingConst = document.getElementById ('dampingSlider').value;
        document.getElementById ('dampingOutput').value = _dDampingConst;
    }


    //
    // OnGravitySliderChange: callback to handle changes with the gravity slider
    //
    function OnGravitySliderChange ()
    {
        _dGravityConst = document.getElementById ('gravitySlider').value;
        document.getElementById ('gravityOutput').value = _dGravityConst;
    }


    //
    // OnTrailCheckboxChange: callback to handle the draw trail checkbox
    //
    function OnTrailCheckboxChange ()
    {
        _DrawTrail = !_DrawTrail;
        document.getElementById ('trailLengthList').disabled = !_DrawTrail;
        document.getElementById ('trailTypeList').disabled = !_DrawTrail;

        if (!_DrawTrail)
            _TrailPoints = [];
    }


    //
    // OnTrailLengthListChange: callback to handle the train length drop down list 
    //
    function OnTrailLengthListChange ()
    {
        _nTrailLength = document.getElementById ('trailLengthList').value;
    }


    //
    // OnTrailTypeListChange: callback to handle the train length drop down list 
    //
    function OnTrailTypeListChange ()
    {
        _nTrailType = document.getElementById ('trailTypeList').value;
    }


    //	
    // register all the callbacks...
    //
    document.getElementById ('StartBtn').addEventListener ('click', OnStartButtonClick);
    document.getElementById ('ResetBtn').addEventListener ('click', OnResetButtonClick);

    document.getElementById ('initAngle1Slider').addEventListener ('change', OnInitAngle1SliderChange);
    document.getElementById ('initAngle1Slider').addEventListener ('input', OnInitAngle1SliderChange);

    document.getElementById ('initAngle2Slider').addEventListener ('change', OnInitAngle2SliderChange);
    document.getElementById ('initAngle2Slider').addEventListener ('input', OnInitAngle2SliderChange);

    document.getElementById ('initAngle3Slider').addEventListener ('change', OnInitAngle3SliderChange);
    document.getElementById ('initAngle3Slider').addEventListener ('input', OnInitAngle3SliderChange);

    document.getElementById ('initSpeed1Slider').addEventListener ('change', OnInitSpeed1SliderChange);
    document.getElementById ('initSpeed1Slider').addEventListener ('input', OnInitSpeed1SliderChange);

    document.getElementById ('initSpeed2Slider').addEventListener ('change', OnInitSpeed2SliderChange);
    document.getElementById ('initSpeed2Slider').addEventListener ('input', OnInitSpeed2SliderChange);

    document.getElementById ('initSpeed3Slider').addEventListener ('change', OnInitSpeed3SliderChange);
    document.getElementById ('initSpeed3Slider').addEventListener ('input', OnInitSpeed3SliderChange);

    document.getElementById ('mass1Slider').addEventListener ('change', OnMass1SliderChange);
    document.getElementById ('mass1Slider').addEventListener ('input', OnMass1SliderChange);

    document.getElementById ('mass2Slider').addEventListener ('change', OnMass2SliderChange);
    document.getElementById ('mass2Slider').addEventListener ('input', OnMass2SliderChange);

    document.getElementById ('mass3Slider').addEventListener ('change', OnMass3SliderChange);
    document.getElementById ('mass3Slider').addEventListener ('input', OnMass3SliderChange);

    document.getElementById ('length1Slider').addEventListener ('change', OnLength1SliderChange);
    document.getElementById ('length1Slider').addEventListener ('input', OnLength1SliderChange);

    document.getElementById ('length2Slider').addEventListener ('change', OnLength2SliderChange);
    document.getElementById ('length2Slider').addEventListener ('input', OnLength2SliderChange);

    document.getElementById ('length3Slider').addEventListener ('change', OnLength3SliderChange);
    document.getElementById ('length3Slider').addEventListener ('input', OnLength3SliderChange);

    document.getElementById ('dampingSlider').addEventListener ('change', OnDampingSliderChange);
    document.getElementById ('dampingSlider').addEventListener ('input', OnDampingSliderChange);

    document.getElementById ('gravitySlider').addEventListener ('change', OnGravitySliderChange);
    document.getElementById ('gravitySlider').addEventListener ('input', OnGravitySliderChange);

    document.getElementById ('trailCB').addEventListener ('change', OnTrailCheckboxChange);
    document.getElementById ('trailLengthList').addEventListener ('change', OnTrailLengthListChange);
    document.getElementById ('trailTypeList').addEventListener ('change', OnTrailTypeListChange);


    //
    // Key variables...
    //
    var theCanvas = document.getElementById ('canvasSimArea');
    var context   = theCanvas.getContext ('2d');

    var _dMaxLength = (theCanvas.height - 6 * (theCanvas.height/25)) / 2;
 
    const MAX_LENGTH           = 50;
    const DEFAULT_INITSPEED_1  = 0.0;
    const DEFAULT_INITSPEED_2  = 0.0;
    const DEFAULT_INITSPEED_3  = 0.0;

    const DEFAULT_INITANGLE_1  = 15 / 180 * Math.PI;
    const DEFAULT_INITANGLE_2  = 60 / 180 * Math.PI;
    const DEFAULT_INITANGLE_3  = 25 / 180 * Math.PI;

    const DEFAULT_MASS_1       = 1;
    const DEFAULT_MASS_2       = 3;
    const DEFAULT_MASS_3       = 5;

    const DEFAULT_LENGTH_1     = 30 / MAX_LENGTH * _dMaxLength;
    const DEFAULT_LENGTH_2     = 40 / MAX_LENGTH * _dMaxLength;
    const DEFAULT_LENGTH_3     = 25 / MAX_LENGTH * _dMaxLength;

    const DEFAULT_DAMPINGCONST = 0.03;
    const DEFAULT_GRAVITYCONST = 9.81;

    const SIM_STATE_STOP       = 1;
    const SIM_STATE_PLAY       = 2;
    const BALL_RADIUS          = 5;
    const ZERO_TOLERANCE       = 0.00001;

    var _dTheta1       = DEFAULT_INITANGLE_1;
    var _dTheta2       = DEFAULT_INITANGLE_2;
    var _dTheta3       = DEFAULT_INITANGLE_3;

    var _dOmega1       = DEFAULT_INITSPEED_1;
    var _dOmega2       = DEFAULT_INITSPEED_2;
    var _dOmega3       = DEFAULT_INITSPEED_3;

    var _dMass1        = DEFAULT_MASS_1;
    var _dMass2        = DEFAULT_MASS_2;
    var _dMass3        = DEFAULT_MASS_3;

    var _dDampingConst = DEFAULT_DAMPINGCONST;
    var _dGravityConst = DEFAULT_GRAVITYCONST;

    var _dLength1      = DEFAULT_LENGTH_1;
    var _dLength2      = DEFAULT_LENGTH_2;
    var _dLength3      = DEFAULT_LENGTH_3;

    var _dTimeStep   = 0.15;
    var _dPrevTheta1 = 999;
    var _dPrevTheta2 = 999;
    var _dPrevTheta3 = 999;
    var _SimState    = SIM_STATE_STOP;
    var _SimTimerId  = 0;

    var _DrawTrail     = false;
    var _nTrailLength  = 100;
    var _TrailPoints   = [];
    var _nTrailType    = 1;

    var _BallColours = [ '#99FFCC', '#99CCFF', '#CC99FF' ];
    var _TrailColours = [ '#00FF80', '#0080FF', '#8000FF' ]

    // Update the UI
    SetParamsValues (true);
    document.getElementById ('trailLengthList').disabled = true;
    document.getElementById ('trailTypeList').disabled = true;

    // Draw the system once
    drawScreen ();
}


