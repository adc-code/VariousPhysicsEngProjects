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

        // draw the frame
        context.strokeStyle = '#000000'; 
        context.strokeRect (1,  1, theCanvas.width-2, theCanvas.height-2);
		
        if (_SimState == SIM_STATE_PLAY)
        {
            updateCalcs ();

            if ( Math.abs (_dCurrXPos - _dPrevXPos) < ZERO_TOLERANCE && 
                 Math.abs (_dCurrYPos - _dPrevYPos) < ZERO_TOLERANCE ) 
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
    // SolveEquationsOfMotion: solves the equations of motion, that is omega double dot and x double dot
    //                         which are produced by the solving the lagrangian
    //
    function SolveEquationsOfMotion (iStateVec)
    {
        // extract values from the state vector 
        var cartVel = iStateVec[0];
        var omega   = iStateVec[1];
        var cartPos = iStateVec[2];
        var theta   = iStateVec[3];

        // Use the matrix formulation 
        var m11 = (_dCartMass + _dPendulumMass);
        var m12 = _dPendulumMass * _dLength * Math.cos (theta);
        var m21 = m12;
        var m22 = _dPendulumMass * _dLength * _dLength;

        var mInv = math.inv ( [ [m11, m12], [m21, m22] ] );

        var f1 = _dPendulumMass * _dLength * Math.sin (theta) * omega * omega - _dKConst * cartPos;
        var f2 = -1 * _dPendulumMass * _dGravityConst * _dLength * Math.sin (theta);

        //f1 -= _dSpringDampingConst * cartVel;
        //f2 -= _dPendulumDampingConst * omega;

        var F = math.matrix ( [f1, f2] );

        // Compute x and theta double dot...
        var DDot = math.multiply (mInv, F);

        return [ DDot._data[0], DDot._data[1], cartVel, omega ];
    }

  
    //
    // MakeStateVector: utility function used to compute the state vector for the runge-kutta calculations
    //
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
        _dPrevTheta = _dTheta;
        _dPrevXPos = _dLength * Math.sin (_dTheta);
        _dPrevYPos = _dLength * Math.cos (_dTheta);

        _dPrevCartPos = _dCartPos;

        var simStepResults = RK4_step ( [_dCartVel, _dOmega, _dCartPos, _dTheta] );

        // uncomment for debugging
        // console.log (_dSpringLength, _dTheta);

        _dCartVel += simStepResults [0];
        _dOmega   += simStepResults [1];
        _dCartPos += simStepResults [2];
        _dTheta   += simStepResults [3];

        // Compute the position of the ball/bob
        _dCurrXPos = _dLength * Math.sin (_dTheta);
        _dCurrYPos = _dLength * Math.cos (_dTheta);

        // console.log (_dCartVel, _dOmega, _dCartPos, _dTheta); 
    }


    //
    // render: used to draw the elements to the canvas
    //
    function redrawSceen () 
    {
        var cnvsWidth  = theCanvas.width;
        var cnvsHeight = theCanvas.height;

        var floorWidth  = cnvsWidth;
        var floorHeight = 0.33 * cnvsHeight;
        var floorThickness = 0.035 * cnvsHeight;

        // clear the window area...
        context.fillStyle = '#666666';
        context.fillRect (0, floorHeight, floorWidth, floorThickness);

        var cartWidth  = 0.18 * cnvsWidth;
        var cartHeight = 0.05 * cnvsHeight;
        var cartOrigin = 0.45 * cnvsWidth;
        var wheelRad   = 0.015 * cnvsHeight;
       
        context.save (); 
        context.fillStyle = '#004466';
        context.moveTo (cartOrigin + _dCartPos, floorHeight - cartHeight - 2*wheelRad);
        context.fillRect (cartOrigin + _dCartPos, floorHeight - cartHeight - 2*wheelRad, cartWidth, cartHeight);
        context.strokeRect (cartOrigin + _dCartPos, floorHeight - cartHeight - 2*wheelRad, cartWidth, cartHeight);
        context.restore ();

        context.save ();
        context.fillStyle = '#ff99ff';
        var massSize = _dCartMass / MAX_MASS_CART * cartHeight;
        context.fillRect (cartOrigin + _dCartPos + 2, floorHeight - 2*wheelRad - cartHeight - massSize, cartWidth - 4, massSize);
        context.strokeRect (cartOrigin + _dCartPos + 2, floorHeight - 2*wheelRad - cartHeight - massSize, cartWidth - 4, massSize);
        context.restore ();


        // 'got some wheels'...        
        var spinAngle = _dCartPos / wheelRad;

        context.save (); 
        context.fillStyle = '#cccccc';

        var wheelOriginX = cartOrigin + _dCartPos + 2*wheelRad;
        var wheelOriginY = floorHeight - wheelRad;

        context.beginPath ();
        context.arc (wheelOriginX, wheelOriginY, wheelRad, 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();

        for (var i = 0; i < 6; i++)
        {
            var spokeAngle = Math.PI / 3 * i + spinAngle;

            context.beginPath ();
            context.moveTo (wheelOriginX, wheelOriginY);
            context.lineTo (wheelOriginX + wheelRad * Math.cos (spokeAngle), wheelOriginY + wheelRad * Math.sin (spokeAngle)); 
            context.stroke ();
        }

        var wheelOriginX = cartOrigin + _dCartPos + cartWidth - 2*wheelRad;

        context.beginPath ();
        context.arc (cartOrigin + _dCartPos + cartWidth - 2*wheelRad, floorHeight - wheelRad, wheelRad, 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();

        for (var i = 0; i < 6; i++)
        {
            var spokeAngle = Math.PI / 3 * i + spinAngle;

            context.beginPath ();
            context.moveTo (wheelOriginX, wheelOriginY);
            context.lineTo (wheelOriginX + wheelRad * Math.cos (spokeAngle), wheelOriginY + wheelRad * Math.sin (spokeAngle)); 
            context.stroke ();
        }
        context.restore ();

        // Draw the spring...
        var springConnectorLen = 1.5*wheelRad;
        var springHeight = floorHeight - 0.5 * cartHeight - 2*wheelRad;
        var springLength = cartOrigin + _dCartPos - 2 * springConnectorLen;

        context.save (); 
        context.beginPath();
        context.moveTo (0, springHeight);
        context.lineTo (2*springConnectorLen, springHeight);
        context.closePath ();
        context.stroke ();
        
        context.beginPath();
        context.moveTo (cartOrigin + _dCartPos, springHeight);
        context.lineTo (cartOrigin + _dCartPos - springConnectorLen, springHeight);
        context.closePath ();
        context.stroke ();
        context.restore ();

        context.save ();
        context.beginPath();
        context.moveTo (2 * springConnectorLen, springHeight)
        var L = 24 * Math.PI;
        var B = (springLength - 2*springConnectorLen) / L;
        for (var i = 0; i <= L; i+=0.1)
        {
            context.lineTo (2 * springConnectorLen + 10 * Math.cos (i) * Math.cos(0) + B * i + 1, springHeight - 7 * Math.sin (i));
        }
        context.stroke ();
            
        // draw the pendulum...
        var pendXOrigin = cartOrigin + _dCartPos + 0.5*cartWidth;
        var pendYOrigin = floorHeight - 2*wheelRad;

        var pendXEnd = pendXOrigin + _dLength * Math.sin (_dTheta);
        var pendYEnd = pendYOrigin + _dLength * Math.cos (_dTheta);

        context.beginPath ();
        context.moveTo (pendXOrigin, pendYOrigin);
        context.lineTo (pendXEnd, pendYEnd);
        context.stroke ();

        context.fillStyle = '#333333';
        context.beginPath ();
        context.arc (pendXOrigin, pendYOrigin, 3, 0, 2*Math.PI, true);
        context.closePath ();
        context.fill ();
        context.stroke ();

        context.fillStyle = '#99ccff';
        context.beginPath ();
        var rad = BALL_RADIUS * Math.sqrt (_dPendulumMass);
        context.arc (pendXEnd, pendYEnd, rad, 0, 2*Math.PI, true);
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

        document.getElementById ('springConstSlider').disabled  = iState;
        document.getElementById ('springConstOutput').disabled  = iState;

        document.getElementById ('massCartSlider').disabled     = iState;
        document.getElementById ('massCartOutput').disabled     = iState;

        document.getElementById ('cartInitPosSlider').disabled  = iState;
        document.getElementById ('cartInitPosOutput').disabled  = iState;

        document.getElementById ('pendLengthSlider').disabled   = iState;
        document.getElementById ('pendLengthOutput').disabled   = iState;

        document.getElementById ('massPendSlider').disabled     = iState;
        document.getElementById ('massPendOutput').disabled     = iState;

        document.getElementById ('initAngleSlider').disabled    = iState;
        document.getElementById ('initAngleOutput').disabled    = iState;

        document.getElementById ('gravitySlider').disabled      = iState;
        document.getElementById ('gravityOutput').disabled      = iState;
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
    // SetParamsValues: used to set the initial values...
    //
    function SetParamsValues (iUseDefaults)
    {
        if (iUseDefaults == true)
        {
            // Reset to default values

            // Pendulum variables...
            _dTheta                = DEFAULT_INITANGLE;
            _dOmega                = DEFAULT_INITSPEED_PEND;
            _dLength               = DEFAULT_LENGTH;
            _dPendulumMass         = DEFAULT_MASS_PEND;
            _dPendulumDampingConst = DEFAULT_PENDDAMPINGCONST;

            // Cart variables...
            _dKConst               = DEFAULT_KCONST;
            _dCartMass             = DEFAULT_MASS_CART;
            _dCartPos              = DEFAULT_INITPOS_CART;
            _dCartVel              = DEFAULT_INITSPEED_CART;

            _dSpringDampingConst   = DEFAULT_SPRINGDAMPINGCONST;
            _dGravityConst         = DEFAULT_GRAVITYCONST;
        }
 
        _dPrevXPos = -999;
        _dPrevYPos = -999;
        _dCurrXPos = _dLength * Math.sin (_dTheta);
        _dCurrYPos = _dLength * Math.cos (_dTheta);

        // Then the UI elements...
        document.getElementById ('springConstSlider').value  = _dKConst;
        document.getElementById ('springConstOutput').value  = _dKConst;

        document.getElementById ('massCartSlider').value     = _dCartMass;
        document.getElementById ('massCartOutput').value     = _dCartMass;

        document.getElementById ('cartInitPosSlider').value  = _dCartPos;
        document.getElementById ('cartInitPosOutput').value  = _dCartPos.toFixed(1);

        var dLengthPercent = 100 * _dLength / _dMaxLength;
        document.getElementById ('pendLengthSlider').value   = dLengthPercent;
        document.getElementById ('pendLengthOutput').value   = dLengthPercent.toFixed(1);

        document.getElementById ('massPendSlider').value     = _dPendulumMass;
        document.getElementById ('massPendOutput').value     = _dPendulumMass;

        document.getElementById ('initAngleSlider').value    = _dTheta * 180 / Math.PI;
        document.getElementById ('initAngleOutput').value    = (_dTheta * 180 / Math.PI).toFixed (1) + '°';

        document.getElementById ('gravitySlider').value      = _dGravityConst;
        document.getElementById ('gravityOutput').value      = _dGravityConst;

        document.getElementById ('ResetBtn').disabled        = false; 
    }


    //
    // OnResetButtonClick: callback to handle the start/top button
    //
    function OnResetButtonClick ()
    {
        if (document.getElementById ('ResetBtn').disabled == false)
        {
            SetParamsValues (true);

            // Make sure that no trail is drawn
            _TrailPoints = [];
            
            // redraw everything...
            drawScreen ();
        }
    }


    //
    // OnInitSpeedSliderChange: callback to handle changes with the initial speed slider
    //
    function OnInitSpeedSliderChange ()
    {
        _dOmega = +document.getElementById ('initSpeedSlider').value;
        document.getElementById ('initSpeedTextBox').value = (_dOmega * 180 / Math.PI).toFixed (1);
    }

   
    // 
    // OnInitAngleSliderChange: callback to handle changes with the initial angle slider
    //
    function OnInitAngleSliderChange ()
    {
        var angle = document.getElementById ('initAngleSlider').value;
        document.getElementById ('initAngleOutput').value = angle + '°';

        _dTheta = angle / 180 * Math.PI;

        _dCurrXPos = _dLength * Math.sin (_dTheta);
        _dCurrYPos = _dLength * Math.cos (_dTheta);

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }


    //
    // OnLengthSliderChange: callback to handle changes with the pendfulum length slider
    //
    function OnLengthSliderChange ()
    {
        var dLengthPercent = document.getElementById ('pendLengthSlider').value;
        _dLength = _dMaxLength * dLengthPercent * 0.01;

        document.getElementById ('pendLengthOutput').value = dLengthPercent;

        _dCurrXPos = _dLength * Math.sin (_dTheta);
        _dCurrYPos = _dLength * Math.cos (_dTheta);

        var nPrevTrailState = _DrawTrail;
        _DrawTrail = false;
        _TrailPoints = [];

        drawScreen ();

        _DrawTrail = nPrevTrailState;
    }

 
    //
    // OnMassCartSliderChange: callback to handle changes with the cart mass slider
    //
    function OnMassCartSliderChange ()
    {
        _dCartMass = +document.getElementById ('massCartSlider').value; 
        document.getElementById ('massCartOutput').value = _dCartMass;

        drawScreen ();
    }


    //
    // OnMassSliderChange: callback to handle changes with the mass slider
    //
    function OnMassPendSliderChange ()
    {
        _dPendulumMass = +document.getElementById ('massPendSlider').value;
        document.getElementById ('massPendOutput').value = _dPendulumMass;

        drawScreen ();
    }


    //
    // OnCartInitPosSliderChange: callback to handle changes with the initial cart position slider
    //
    function OnCartInitPosSliderChange ()
    {
        _dCartPos = +document.getElementById ('cartInitPosSlider').value;
        document.getElementById ('cartInitPosOutput').value = _dCartPos; 

        drawScreen ();
    }


    //
    // OnKSliderChange: callback to handle changes with the K constant
    //
    function OnKSliderChange ()
    {
        _dKConst = +document.getElementById ('springConstSlider').value;
        document.getElementById ('springConstOutput').value = _dKConst;
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
    // OnTrailLengthListChange: callback to handle the trail list length
    //
    function OnTrailLengthListChange ()
    {
        var nTrailLength = +document.getElementById ('trailLengthList').value;

        if (nTrailLength < 0)
        {
            _DrawTrail = false;
            _TrailPoints = [];

            // redraw the screen any previous trails are removed...
            drawScreen ();
        }
        else
        {
            _DrawTrail = true;
            _nTrailLength = nTrailLength;
        }
    }


    //	
    // register all the callbacks...
    //
    document.getElementById ('StartBtn').addEventListener ('click', OnStartButtonClick);
    document.getElementById ('ResetBtn').addEventListener ('click', OnResetButtonClick);

    document.getElementById ('springConstSlider').addEventListener ('change', OnKSliderChange);
    document.getElementById ('springConstSlider').addEventListener ('input', OnKSliderChange);

    document.getElementById ('massCartSlider').addEventListener ('change', OnMassCartSliderChange);
    document.getElementById ('massCartSlider').addEventListener ('input', OnMassCartSliderChange);

    document.getElementById ('cartInitPosSlider').addEventListener ('change', OnCartInitPosSliderChange);
    document.getElementById ('cartInitPosSlider').addEventListener ('input', OnCartInitPosSliderChange);

    document.getElementById ('pendLengthSlider').addEventListener ('change', OnLengthSliderChange);
    document.getElementById ('pendLengthSlider').addEventListener ('input', OnLengthSliderChange);

    document.getElementById ('massPendSlider').addEventListener ('change', OnMassPendSliderChange);
    document.getElementById ('massPendSlider').addEventListener ('input', OnMassPendSliderChange);

    document.getElementById ('initAngleSlider').addEventListener ('change', OnInitAngleSliderChange);
    document.getElementById ('initAngleSlider').addEventListener ('input', OnInitAngleSliderChange);

    document.getElementById ('gravitySlider').addEventListener ('change', OnGravitySliderChange);
    document.getElementById ('gravitySlider').addEventListener ('input', OnGravitySliderChange);



    var theCanvas = document.getElementById ('canvasSimArea');
    var context   = theCanvas.getContext ('2d');

    var _dMaxLength = 2 / 3 * theCanvas.height; 
 
    const DEFAULT_INITANGLE          = 30 / 180 * Math.PI;
    const DEFAULT_INITSPEED_PEND     = 0.0;
    const DEFAULT_INITPOS_CART       = 0.0;
    const DEFAULT_INITSPEED_CART     = 0.0;
    const DEFAULT_MASS_CART          = 10.0;
    const MAX_MASS_CART              = 20.0;
    const DEFAULT_MASS_PEND          = 3.0;
    const DEFAULT_LENGTH             = 0.5 * _dMaxLength;
    const DEFAULT_KCONST             = 5.0;
    const DEFAULT_PENDDAMPINGCONST   = 0.3;
    const DEFAULT_SPRINGDAMPINGCONST = 0.2;
    const DEFAULT_GRAVITYCONST       = 9.8;

    const SIM_STATE_STOP             = 1;
    const SIM_STATE_PLAY             = 2;
    const BALL_RADIUS                = 5;
    const ZERO_TOLERANCE             = 0.0001;
    const SPRING_SCALING             = 0.05;

    var _dTheta                      = DEFAULT_INITANGLE;
    var _dOmega                      = DEFAULT_INITSPEED_PEND;
    var _dPendulumMass               = DEFAULT_MASS_PEND;
    var _dLength                     = DEFAULT_LENGTH;

    var _dKConst                     = DEFAULT_KCONST;
    var _dCartMass                   = DEFAULT_MASS_CART;
    var _dCartPos                    = DEFAULT_INITPOS_CART;
    var _dCartVel                    = DEFAULT_INITSPEED_CART;

    var _dPendulumDampingConst       = DEFAULT_PENDDAMPINGCONST;
    var _dSpringDampingConst         = DEFAULT_SPRINGDAMPINGCONST;
    var _dGravityConst               = DEFAULT_GRAVITYCONST;

    var _dTimeStep                   = 0.15;
    var _SimState                    = SIM_STATE_STOP;
    var _SimTimerId                  = 0;

    var _dPrevXPos                   = -999;
    var _dPrevYPos                   = -999;
    var _dCurrXPos                   = _dLength * Math.sin (_dTheta);
    var _dCurrYPos                   = _dLength * Math.cos (_dTheta);
    var _dPrevTheta                  = 999;
    
    var _TrailPoints                 = [];
    var _DrawTrail                   = false;
    var _nTrailLength                = 100;

    SetParamsValues (true);
    drawScreen ();
}



