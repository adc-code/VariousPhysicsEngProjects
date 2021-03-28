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
                 Math.abs (_dPrevTheta2 - _dTheta2) < ZERO_TOLERANCE )
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
 
        var theta1 = iStateVec[2];
        var theta2 = iStateVec[3];

	// Create a two by two matrix with the necessary elements.  
        var m11 = (_dMass1 + _dMass2) * _dLength1;
        var m12 = _dMass2 * _dLength2 * Math.cos (theta1 - theta2);
        var m21 = _dLength1 * Math.cos (theta1 - theta2);
        var m22 = _dLength2;

        // Uncomment for debugging...
        // console.log (math.det ( [ [m11, m12], [m21, m22] ] ) );
        // var dDeterminant = m11 * m22  -  m12 * m21;
        // var invM11 = m22 / dDeterminant;
        // var invM12 = -1 * m21 / dDeterminant;
        // var invM21 = -1 * m12 / dDeterminant;
        // var invM22 = m11 / dDeterminant;
        // console.log (dDeterminant, invM11, invM12, invM21, invM22);

        // Actually we are not computing the matrix, rather the inverse of the matrix
        var mInv = math.inv ( [ [m11, m12], [m21, m22] ] );

        var f1 = -1 * _dMass2 * _dLength2 * omega2 * omega2 * Math.sin (theta1 - theta2) - (_dMass1 + _dMass2) * _dGravityConst * Math.sin (theta1);
        var f2 = _dLength1 * omega1 * omega1 * Math.sin (theta1 - theta2) - _dGravityConst * Math.sin (theta2);

        // This damping is just a very slight approximation
        f1 -= _dDampingConst * omega1;
        f2 -= _dDampingConst * omega2;

        // Make a matrix of the stuff of the 'remaining stuff' from the lagrangian
        var F = math.matrix ( [f1, f2] );

        // Compute theta double dot...
        var thetaDDot = math.multiply (mInv, F);

        // Uncomment for debugging...
        // console.log (thetaDDot._data[0], thetaDDot._data[1], f1, f2);

        return [ thetaDDot._data[0], thetaDDot._data[1], omega1, omega2 ];
    }

    function MakeStateVector (iStateVec, iKVec, iMultiplier)
    {
        var results = [];
        for (var i = 0; i < 4; i++)
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

        var results = [ _dTimeStep * (k1[0] + 2*k2[0] + 2*k3[0] + k4[0]) / 6,
                        _dTimeStep * (k1[1] + 2*k2[1] + 2*k3[1] + k4[1]) / 6, 
                        _dTimeStep * (k1[2] + 2*k2[2] + 2*k3[2] + k4[2]) / 6, 
                        _dTimeStep * (k1[3] + 2*k2[3] + 2*k3[3] + k4[3]) / 6 ];

        return results;
    }


    //
    // update: updates the positions for all the balls
    //
    function updateCalcs ()
    {
        _dPrevTheta1 = _dTheta1;
        _dPrevTheta2 = _dTheta2;

        var simStepResults = RK4_step ( [_dOmega1, _dOmega2, _dTheta1, _dTheta2] );

        _dOmega1 += simStepResults[0];
        _dOmega2 += simStepResults[1];
        _dTheta1 += simStepResults[2];
        _dTheta2 += simStepResults[3];

        // uncomment for debugging
        // console.log (_dTheta1, _dTheta2); //, _dOmega1, _dOmega2);
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

        var xOrigin = cnvsWidth/2;
        var yOrigin = boxHeight*3;
        
        context.fillStyle = '#666666';
        context.fillRect ((cnvsWidth - boxWidth) / 2, boxHeight  * 2, boxWidth, boxHeight);

        if (_DrawTrail)
        {
            _TrailPoints.push ( [xPos2, yPos2 ] );
            while (_TrailPoints.length > _nTrailLength)
            { 
                _TrailPoints.shift ();
            }

            context.beginPath();
            context.moveTo (xOrigin + _TrailPoints[0][0], yOrigin + _TrailPoints[0][1]);
            for (var i = 1; i < _TrailPoints.length; i++)
            {
                context.strokeStyle = '#000066';
                context.lineTo (xOrigin + _TrailPoints[i][0], yOrigin + _TrailPoints[i][1]);
            }
            context.stroke ();
        }
        context.strokeStyle = '#000';

        context.beginPath();
        context.moveTo (xOrigin, yOrigin);
        context.lineTo (xOrigin + xPos1, yOrigin + yPos1);
        context.lineTo (xOrigin + xPos2, yOrigin + yPos2);
        context.stroke ();

        context.fillStyle = '#cccccc';
        context.beginPath ();
        context.arc (xOrigin, yOrigin, BALL_RADIUS, 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();

        context.fillStyle = '#99e6ff';
        context.beginPath ();
        context.arc (xOrigin + xPos1, yOrigin + yPos1, BALL_RADIUS * Math.sqrt (_dMass1), 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();

        context.fillStyle = '#ffe699';
        context.beginPath ();
        context.arc (xOrigin + xPos2, yOrigin + yPos2, BALL_RADIUS * Math.sqrt (_dMass2), 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();
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

        document.getElementById ('initSpeed1Slider').disabled  = iState;
        document.getElementById ('initSpeed1TextBox').disabled = iState;

        document.getElementById ('initSpeed2Slider').disabled  = iState;
        document.getElementById ('initSpeed2TextBox').disabled = iState;

        document.getElementById ('initAngle1Slider').disabled  = iState;
        document.getElementById ('initAngle1TextBox').disabled = iState;

        document.getElementById ('initAngle2Slider').disabled  = iState;
        document.getElementById ('initAngle2TextBox').disabled = iState;

        document.getElementById ('mass1Slider').disabled       = iState;
        document.getElementById ('mass1TextBox').disabled      = iState;

        document.getElementById ('mass2Slider').disabled       = iState;
        document.getElementById ('mass2TextBox').disabled      = iState;

        document.getElementById ('length1Slider').disabled     = iState;
        document.getElementById ('length1TextBox').disabled    = iState;

        document.getElementById ('length2Slider').disabled     = iState;
        document.getElementById ('length2TextBox').disabled    = iState;

        document.getElementById ('dampingSlider').disabled     = iState;
        document.getElementById ('dampingTextBox').disabled    = iState;

        document.getElementById ('gravitySlider').disabled     = iState;
        document.getElementById ('gravityTextBox').disabled    = iState;
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
            _dOmega1       = DEFAULT_INITSPEED_1;
            _dOmega2       = DEFAULT_INITSPEED_2;
            _dDampingConst = DEFAULT_DAMPINGCONST;
            _dGravityConst = DEFAULT_GRAVITYCONST;
            _dLength1      = DEFAULT_LENGTH_1;
            _dLength2      = DEFAULT_LENGTH_2;
            _dMass1        = DEFAULT_MASS_1;
            _dMass2        = DEFAULT_MASS_2;
        }
 
        _dPrevTheta1 = 999;
        _dPrevTheta2 = 999;

        // Then the UI elements...
        document.getElementById ('initSpeed1Slider').value  = _dOmega1;
        document.getElementById ('initSpeed1TextBox').value = (_dOmega1 * 180 / Math.PI).toFixed (1);

        document.getElementById ('initSpeed2Slider').value  = _dOmega2;
        document.getElementById ('initSpeed2TextBox').value = (_dOmega2 * 180 / Math.PI).toFixed (1);

        document.getElementById ('initAngle1Slider').value  = _dTheta1 * 180 / Math.PI;
        document.getElementById ('initAngle1TextBox').value = (_dTheta1 * 180 / Math.PI).toFixed (1) + '°';

        document.getElementById ('initAngle2Slider').value  = _dTheta2 * 180 / Math.PI;
        document.getElementById ('initAngle2TextBox').value = (_dTheta2 * 180 / Math.PI).toFixed (1) + '°';

        document.getElementById ('length1Slider').value     = _dLength1 * MAX_LENGTH / _dMaxLength;
        document.getElementById ('length1TextBox').value    = (_dLength1 * MAX_LENGTH / _dMaxLength).toFixed (0);

        document.getElementById ('length2Slider').value     = _dLength2 * MAX_LENGTH / _dMaxLength;
        document.getElementById ('length2TextBox').value    = (_dLength2 * MAX_LENGTH / _dMaxLength).toFixed (0);

        document.getElementById ('mass1Slider').value       = _dMass1;
        document.getElementById ('mass1TextBox').value      = _dMass1;
        
        document.getElementById ('mass2Slider').value       = _dMass2;
        document.getElementById ('mass2TextBox').value      = _dMass2;

        document.getElementById ('dampingSlider').value     = _dDampingConst;
        document.getElementById ('dampingTextBox').value    = _dDampingConst;

        document.getElementById ('gravitySlider').value     = _dGravityConst;
        document.getElementById ('gravityTextBox').value    = _dGravityConst;

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
    // OnInitSpeed1SliderChange: callback to handle changes with the initial speed slider
    //
    function OnInitSpeed1SliderChange ()
    {
        _dOmega1 = +document.getElementById ('initSpeed1Slider').value;
        document.getElementById ('initSpeed1TextBox').value = (_dOmega1 * 180 / Math.PI).toFixed (1);
    }

   
    //
    // OnInitSpeedSliderChange: callback to handle changes with the initial speed slider
    //
    function OnInitSpeed2SliderChange ()
    {
        _dOmega2 = +document.getElementById ('initSpeed2Slider').value;
        document.getElementById ('initSpeed2TextBox').value = (_dOmega2 * 180 / Math.PI).toFixed (1);
    }

   
    // 
    // OnInitAngle1SliderChange: callback to handle changes with the initial angle slider
    //
    function OnInitAngle1SliderChange ()
    {
        var angle = document.getElementById ('initAngle1Slider').value;
        document.getElementById ('initAngle1TextBox').value = angle + '°';

        _dTheta1 = angle / 180 * Math.PI;

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    // 
    // OnInitAngle1SliderChange: callback to handle changes with the initial angle slider
    //
    function OnInitAngle2SliderChange ()
    {
        var angle = document.getElementById ('initAngle2Slider').value;
        document.getElementById ('initAngle2TextBox').value = angle + '°';

        _dTheta2 = angle / 180 * Math.PI;

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

        document.getElementById ('length1TextBox').value = dLength;

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    //
    // OnLength2SliderChange: callback to handle changes with the length 1 slider
    //
    function OnLength2SliderChange ()
    {
        var dLength = document.getElementById ('length2Slider').value;
        _dLength2 = _dMaxLength * dLength / MAX_LENGTH;

        document.getElementById ('length2TextBox').value = dLength;

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
        document.getElementById ('mass1TextBox').value = _dMass1;

        drawScreen ();
    }


    //
    // OnMass2SliderChange: callback to handle changes to the lower mass
    //
    function OnMass2SliderChange ()
    {
        _dMass2 = +document.getElementById ('mass2Slider').value;
        document.getElementById ('mass2TextBox').value = _dMass2;

        drawScreen ();
    }


    //
    // OnDampingSliderChange: callback to handle changes with the dampling slider
    //
    function OnDampingSliderChange ()
    {
        _dDampingConst = document.getElementById ('dampingSlider').value;
        document.getElementById ('dampingTextBox').value = _dDampingConst;
    }


    //
    // OnGravitySliderChange: callback to handle changes with the gravity slider
    //
    function OnGravitySliderChange ()
    {
        _dGravityConst = document.getElementById ('gravitySlider').value;
        document.getElementById ('gravityTextBox').value = _dGravityConst;
    }


    //
    // OnTrailCheckboxChange: callback to handle the draw trail checkbox
    //
    function OnTrailCheckboxChange ()
    {
        _DrawTrail = !_DrawTrail;
        document.getElementById ('trailLengthList').disabled = !_DrawTrail;

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
    // register all the callbacks...
    //
    document.getElementById ('StartBtn').addEventListener ('click', OnStartButtonClick);
    document.getElementById ('ResetBtn').addEventListener ('click', OnResetButtonClick);

    document.getElementById ('initAngle1Slider').addEventListener ('change', OnInitAngle1SliderChange);
    document.getElementById ('initAngle1Slider').addEventListener ('input', OnInitAngle1SliderChange);

    document.getElementById ('initAngle2Slider').addEventListener ('change', OnInitAngle2SliderChange);
    document.getElementById ('initAngle2Slider').addEventListener ('input', OnInitAngle2SliderChange);

    document.getElementById ('initSpeed1Slider').addEventListener ('change', OnInitSpeed1SliderChange);
    document.getElementById ('initSpeed1Slider').addEventListener ('input', OnInitSpeed1SliderChange);

    document.getElementById ('initSpeed2Slider').addEventListener ('change', OnInitSpeed2SliderChange);
    document.getElementById ('initSpeed2Slider').addEventListener ('input', OnInitSpeed2SliderChange);

    document.getElementById ('mass1Slider').addEventListener ('change', OnMass1SliderChange);
    document.getElementById ('mass1Slider').addEventListener ('input', OnMass1SliderChange);

    document.getElementById ('mass2Slider').addEventListener ('change', OnMass2SliderChange);
    document.getElementById ('mass2Slider').addEventListener ('input', OnMass2SliderChange);

    document.getElementById ('length1Slider').addEventListener ('change', OnLength1SliderChange);
    document.getElementById ('length1Slider').addEventListener ('input', OnLength1SliderChange);

    document.getElementById ('length2Slider').addEventListener ('change', OnLength2SliderChange);
    document.getElementById ('length2Slider').addEventListener ('input', OnLength2SliderChange);

    document.getElementById ('dampingSlider').addEventListener ('change', OnDampingSliderChange);
    document.getElementById ('dampingSlider').addEventListener ('input', OnDampingSliderChange);

    document.getElementById ('gravitySlider').addEventListener ('change', OnGravitySliderChange);
    document.getElementById ('gravitySlider').addEventListener ('input', OnGravitySliderChange);

    document.getElementById ('trailCB').addEventListener ('change', OnTrailCheckboxChange);
    document.getElementById ('trailLengthList').addEventListener ('change', OnTrailLengthListChange);


    //
    // Key variables...
    //
    var theCanvas = document.getElementById ('canvasSimArea');
    var context   = theCanvas.getContext ('2d');

    var _dMaxLength = (theCanvas.height - 6 * (theCanvas.height/25)) / 2;
 
    const MAX_LENGTH           = 50;
    const DEFAULT_INITSPEED_1  = 0.0;
    const DEFAULT_INITSPEED_2  = 0.0;
    const DEFAULT_INITANGLE_1  = 15 / 180 * Math.PI;
    const DEFAULT_INITANGLE_2  = 60 / 180 * Math.PI;
    const DEFAULT_MASS_1       = 1;
    const DEFAULT_MASS_2       = 5;
    const DEFAULT_LENGTH_1     = 30 / MAX_LENGTH * _dMaxLength;
    const DEFAULT_LENGTH_2     = 40 / MAX_LENGTH * _dMaxLength;
    const DEFAULT_DAMPINGCONST = 0.03;
    const DEFAULT_GRAVITYCONST = 9.81;

    const SIM_STATE_STOP       = 1;
    const SIM_STATE_PLAY       = 2;
    const BALL_RADIUS          = 5;
    const ZERO_TOLERANCE       = 0.00001;

    var _dTheta1       = DEFAULT_INITANGLE_1;
    var _dTheta2       = DEFAULT_INITANGLE_2;
    var _dOmega1       = DEFAULT_INITSPEED_1;
    var _dOmega2       = DEFAULT_INITSPEED_2;
    var _dMass1        = DEFAULT_MASS_1;
    var _dMass2        = DEFAULT_MASS_2;
    var _dDampingConst = DEFAULT_DAMPINGCONST;
    var _dGravityConst = DEFAULT_GRAVITYCONST;
    var _dLength1      = DEFAULT_LENGTH_1;
    var _dLength2      = DEFAULT_LENGTH_2;

    var _dTimeStep   = 0.15;
    var _dPrevTheta1 = 999;
    var _dPrevTheta2 = 999;
    var _SimState    = SIM_STATE_STOP;
    var _SimTimerId  = 0;

    var _DrawTrail     = false;
    var _nTrailLength  = 100;
    var _TrailPoints   = [];

    // Update the UI
    SetParamsValues (true);
    document.getElementById ('trailLengthList').disabled = true;

    // Draw the system once
    drawScreen ();
}


