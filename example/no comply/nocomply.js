

document.addEventListener("DOMContentLoaded", function (e) {

    const LEFT_BORDER = 40;
    const RIGHT_BORDER = 19;
    const MOVE_SPEED = 0.2;
    //const JUMP_HEIGHT

    var keyStates = [];

    var printd = function( div, str ) {
        document.getElementById( div ).innerHTML = str + '<p>';
    };
    var cleard = function( div ) {
        document.getElementById( div ).innerHTML = '';
    };


    /**
    */
    var IdleState = (function(){

      function IdleState(player){
      
        var pl = player;
        
        this.moveForward = function(){pl.setState(pl.getMoveForwardState());};
        this.moveBackward = function(){pl.setState(pl.getMoveBackwardState());};
        this.jump = function(){pl.setState(pl.getJumpState());};
        this.idle = function(){console.log('already idle');};
        this.block = function(){pl.setState(pl.getBlockState());};
        this.punch = function(){pl.setState(pl.getPunchState());};
        this.kick = function(){pl.setState(pl.getKickState());};
        this.throwFireBall = function(){pl.setState(pl.getThrowFireBallState());};
        this.spin = function(){pl.setState(pl.getSpinState());};
        
        this.dead = function(){
          pl.setState(pl.getDeadState());
        }
        
        this.update = function(t){
          // update sprite randomly?
        };
        
        this.toString = function(){
          return "Idle State";
        }; 
      }
      
      return IdleState;
    }());


    /**
      Character is spinning around and can get hit by the other player.
    */
    var SpinState = (function(){

      function SpinState(player){
      
        var pl = player;
        var timeElapsed = 0;
        
        /*this.moveForward = function(){};
        this.moveBackward = function(){};
        this.jump = function(){};
        this.idle = function(){};
        this.block = function(){};
        this.punch = function(){};
        this.kick = function(){};
        this.throwFireBall = function(){};
        this.spin = function(){};
        */
        
        this.dead = function(){
          pl.setState(pl.getDeadState());
        }
        
        // Should we slow down the character?
        this.update = function(t, pc){
        
          timeElapsed += t;
          var rot  = pc.rotation;
          
          // rotate the sprite very fast          
          if(timeElapsed < 2){
          rot[1] += 15;
          pc.rotation = rot;
          }
          else{
            timeElapsed = 0;
            
            // place character back
            rot[1] = 0;
            pc.rotation = rot;
            
            pl.setState(pl.getIdleState());
          }

        };
        
        this.toString = function(){
          return "Spin State: " + (2 - timeElapsed);
        }; 
      }
      
      return SpinState;
    }());


    /**
      Character is frozen and can get hit by the other player.
    */
    var FrozenState = (function(){

      function FrozenState(player){
      
        var pl = player;
        var timeElapsed = 0;
        
        /*this.moveForward = function(){};
        this.moveBackward = function(){};
        this.jump = function(){};
        this.idle = function(){};
        this.block = function(){};
        this.punch = function(){};
        this.kick = function(){};
        this.throwFireBall = function(){};
        this.spin = function(){};
        this.freeze = function(){}
        */
        
        this.dead = function(){
          pl.setState(pl.getDeadState());
        }
        
        // Should we slow down the character?
        this.update = function(t, pc){
          timeElapsed += t;
        };
        
        this.toString = function(){
          return "Frozen State: " + (2 - timeElapsed);
        }; 
      }
      
      return FrozenState;
    }());
    
    

    /**
      Users can't transition to another state from the dead state.
    */
    var DeadState = (function(){

      function DeadState(player){
        var pl = player;
        
        /*this.moveForward = function(){};
        this.moveBackward = function(){};
        this.jump = function(){};
        this.idle = function(){};
        this.block = function(){};
        this.punch = function(){};
        this.kick = function(){};*/

        this.update = function(t, pc){
            pc.rotation
        };
        
        this.toString = function(){
          return "Dead State";
        };
        
      }
      
      return DeadState;
    }());

    /**
    */
    var BlockState = (function(){

      function BlockState(player){
        var pl = player;

        this.moveForward = function(){console.log('cant move if blocking');};
        this.moveBackward = function(){console.log('cant move if blocking');};
        this.jump = function(){console.log('cant jump if blocking');};

        this.idle = function(){
          pl.setState(pl.getIdleState());
        };
            
        this.block = function(){console.log('already blocking');};
        this.punch = function(){console.log('cant punch if blocking');};
        this.kick = function(){console.log('cant kick if blocking');};

        this.dead = function(){
          pl.setState(pl.getDeadState());
        }
        
        this.update = function(t){
        };

        this.toString = function(){
          return "Block State";
        };
      }
      
      return BlockState;
    }());


    /**
    */
    var ThrowFireBallState = (function(){

      function ThrowFireBallState(player){
        var pl = player;
        var fireBallTimeElapsed = 0;

        /*this.moveForward = function(){};
        this.moveBackward = function(){};
        this.jump = function(){};
        this.idle = function(){};
        this.block = function(){};
        this.punch = function(){};
        this.kick = function(){};*/

        this.spin = function(){pl.setState(pl.getSpinState());};
        
        this.dead = function(){
          pl.setState(pl.getDeadState());
        }

        this.update = function(t, pc){
          fireBallTimeElapsed += t;
          
          if(fireBallTimeElapsed > 1){
            fireBallTimeElapsed = 0;
            pl.setState(pl.getIdleState());
          }
        };

        this.toString = function(){
          return "Throw Fire Ball State";
        };

      }
      
      return ThrowFireBallState;
    }());


    /**
    */
    var PunchState = (function(){

      function PunchState(player){
        var pl = player;
        var punchTimeElapsed = 0;

        /*this.moveForward = function(){console.log('cant move forward if punching');};
        this.moveBackward = function(){console.log('cant move forward if punching');};
        this.jump = function(){console.log('cant jump if punching');};
        this.idle = function(){console.log('cant idle if punching');};
        this.block = function(){console.log('cant block if punching');};
        this.punch = function(){console.log('already punching');};
        this.kick = function(){console.log('cant kick if punching');};*/

        //!!!
        //can they be spun??

        this.dead = function(){
          pl.setState(pl.getDeadState());
        }
        
        this.update = function(t, pc){
          punchTimeElapsed += t;
          if(punchTimeElapsed > 0.5){
            punchTimeElapsed = 0;
            pl.setState(pl.getIdleState());
          }
        };

        this.toString = function(){
          return "Punch State";
        };

      }
      
      return PunchState;
    }());

    /**
    */
    var KickState = (function(){

      function KickState(player){
        var pl = player;
        var kickTimeElapsed = 0;
        
        /*this.moveForward = function(){console.log('cant move forward if kicking');};
        this.moveBackward = function(){console.log('cant move backward if kicking');};
        this.jump = function(){console.log('cant jump if kicking');};
        this.idle = function(){p.setState('cant idle if kicking');};
        this.block = function(){console.log('cant block if kicking');};
        this.punch = function(){console.log('cant punch if kicking');};
        this.kick = function(){console.log('already kicking');};*/

        this.dead = function(){
          pl.setState(pl.getDeadState());
        }
        
        this.update = function(t){
          kickTimeElapsed += t;
          if(kickTimeElapsed > 0.5){
            kickTimeElapsed = 0;
            pl.setState(pl.getIdleState());
          }
        };

        this.toString = function(){
          return "Kick State";
        };

      }
      
      return KickState;
    }());

    /**
    */
    var MoveForwardState = (function(){

      function MoveForwardState(player){
        var pl = player;

        this.moveForward = function(){console.log('already moving forward');};
        this.moveBackward = function(){console.log('already moving backward');};

//???        this.forwardJump = function(){pl.setState(pl.getForwardJumpState());};
        this.jump = function(){pl.setState(pl.getForwardJumpState());};

        this.idle = function(){   pl.setState(pl.getIdleState());};
        this.block = function(){  pl.setState(pl.getBlockState());};
        this.punch = function(){  pl.setState(pl.getPunchState());};
        this.kick = function(){   pl.setState(pl.getKickState());};
        this.throwFireBall = function(){pl.setState(pl.getThrowFireBallState());};
        this.dead = function(){pl.setState(pl.getDeadState());};
        
        this.spin = function(){pl.setState(pl.getSpinState());};
        
        this.update = function(t, pc){
            var pos = pc.position;
          // near the boxes of the abandoned house
          if( pos[2] > RIGHT_BORDER){

            pos[2] -= MOVE_SPEED;
            pc.position = pos;
          }
        };

        this.toString = function(){
          return "Move Forward State";
        };

      }
      
      return MoveForwardState;
    }());


    /**
    */
    var MoveBackwardState = (function(){

      function MoveBackwardState(player){
        var pl = player;
        
        this.moveForward = function(){
          //console.log('already moving forward');
        };

        this.moveBackward = function(){
          console.log('already moving forward');
        };
        
        this.jump = function(){pl.setState(pl.getBackwardJumpState());};
        this.idle = function(){pl.setState(pl.getIdleState());};
        this.block = function(){pl.setState(pl.getBlockState());};
        this.punch = function(){pl.setState(pl.getPunchState());};
        this.kick = function(){pl.setState(pl.getKickState());};
        this.throwFireBall = function(){pl.setState(pl.getThrowFireBallState());};
        this.spin = function(){pl.setState(pl.getSpinState());};
        
        this.dead = function(){
          pl.setState(pl.getDeadState());
        }

        this.update = function(t, pc){
          var pos = pc.position;
          
          if(pos[2] < LEFT_BORDER ){
            pos[2] += MOVE_SPEED;
            pc.position = pos;
          }
        };

        this.toString = function(){
          return "Move Backward State";
        };

      }
      
      return MoveBackwardState;
    }());

    /**
      Player is recovering from being hit. At this point they just need to wait until
      the character gets back up.
    */
    var RecoverState = (function(){

      function RecoverState(player){
        var pl = player;
        
        /*
        this.moveForward = function(){};
        this.moveBackward = function(){};
        this.jump = function(){};
        this.idle = function(){};
        this.block = function(){};
        this.punch = function(){};
        this.kick = function(){};
        this.throwFireBall = function(){};*/
        
        this.dead = function(){
          pl.setState(pl.getDeadState());
        }

        this.update = function(t, pc){
          // change sprite animation here of character getting back up.
        };

        this.toString = function(){
          return "Recover State";
        };

      }
      
      return RecoverState;
    }());
    

  /**
  */
  var JumpState = (function(){

    function JumpState(player){
      var pl = player;
      var jumpTimeElapsed = 0;

      /*this.moveForward = function(){console.log('cant move forward if jumping');};
      this.moveBackward = function(){console.log('cant move backward if jumping');};
      this.jump = function(){console.log('already jumping');};
      this.idle = function(){console.log('cant idle while jumping');};
      this.block = function(){console.log('cant block if jumping');};
      this.punch = function(){alert('take care of this case!');};*/
      
      // !!! can they be spun?
      
      // !!!
      this.kick = function(){alert('fix me');};
      this.hit = function(){
      // !!!
      // fix me
      };


      this.dead = function(){pl.setState(pl.getDeadState());};
      
      this.update = function(t, pc){
        jumpTimeElapsed += t;
        
        if(jumpTimeElapsed < 1){
          pos = pc.position;
          pos[1] += Math.sin(jumpTimeElapsed * Math.PI * 2) * 1.013;        
          pc.position = pos;
        }
        
       if(jumpTimeElapsed >= 1){
         // !!! fix this
         pos[1] = 8;
         pc.position[1] = 8;
         console.log(pc.position);

         pl.setState(pl.getIdleState());
         jumpTimeElapsed = 0;
        
          /// fix this.
          // Let's say the user moves forward, jumps then lets go of moving
          // forward key. They still need to move forward until they land
          //  player.removeState(player.getMoveForwardState());
        }
      };

      this.toString = function(){
        return "Jump State: " + jumpTimeElapsed;
      };
      
    }
    return JumpState;
  }());



  /**
    Character walks forward and jumps
  */
  var ForwardJumpState = (function(){

    function ForwardJumpState(player){
      var pl = player;
      var jumpTimeElapsed = 0;

      /*this.moveForward = function(){console.log('cant move forward if jumping');};
      this.moveBackward = function(){console.log('cant move backward if jumping');};
      this.jump = function(){console.log('already jumping');};
      this.idle = function(){console.log('cant idle while jumping');};
      this.block = function(){console.log('cant block if jumping');};
      this.punch = function(){alert('take care of this case!');};*/
      
      // !!!
      this.kick = function(){alert('fix me');};
      this.hit = function(){
      // !!!
      // fix me
      };

      this.dead = function(){pl.setState(pl.getDeadState());};
      
      this.update = function(t, pc){
        jumpTimeElapsed += t;
        
        
        // !!! Fix this
        if(jumpTimeElapsed < 1){
          pos = pc.position;
          pos[1] += Math.sin(jumpTimeElapsed * Math.PI * 2) * 1.013;        

          // Fix this !!!
          if(pos[2] > RIGHT_BORDER){
            pos[2] -= MOVE_SPEED;
            pc.position = pos;
          }

          pc.position = pos;
        }
        
       if(jumpTimeElapsed >= 1){
         // !!! fix this
         pos[1] = 8;
         pc.position[1] = 8;
         console.log(pc.position);

         pl.setState(pl.getIdleState());
         jumpTimeElapsed = 0;
        
          /// fix this.
          // Let's say the user moves forward, jumps then lets go of moving
          // forward key. They still need to move forward until they land
          //  player.removeState(player.getMoveForwardState());
        }
      };

      this.toString = function(){
        return "Forward Jump State: " + jumpTimeElapsed;
      };
      
    }
    return ForwardJumpState;
  }());


  /**
    Character walks backward and jumps
  */
  var BackwardJumpState = (function(){

    function BackwardJumpState(player){
      var pl = player;
      var jumpTimeElapsed = 0;

      /*this.moveForward = function(){console.log('cant move forward if jumping');};
      this.moveBackward = function(){console.log('cant move backward if jumping');};
      this.jump = function(){console.log('already jumping');};
      this.idle = function(){console.log('cant idle while jumping');};
      this.block = function(){console.log('cant block if jumping');};
      this.punch = function(){alert('take care of this case!');};*/
      
      // !!!
      this.kick = function(){alert('fix me');};
      this.hit = function(){
      // !!!
      // fix me
      };

      this.dead = function(){pl.setState(pl.getDeadState());};
      
      this.update = function(t, pc){
        jumpTimeElapsed += t;
        var pos = pc.position;
                  
        if(jumpTimeElapsed < 1){
          pos[1] += Math.sin(jumpTimeElapsed * Math.PI * 2) * 1.013;
          
          // Fix this !!!
          if(pos[2] < LEFT_BORDER){
            pos[2] += MOVE_SPEED;
            pc.position = pos;
          }
          
          pc.position = pos;
        }
        
       if(jumpTimeElapsed >= 1){
         // !!! fix this
         pos[1] = 8;
         pc.position[1] = 8;
         console.log(pc.position);

         pl.setState(pl.getIdleState());
         jumpTimeElapsed = 0;
        
          /// fix this.
          // Let's say the user moves forward, jumps then lets go of moving
          // forward key. They still need to move forward until they land
          //  player.removeState(player.getMoveForwardState());
        }
      };

      this.toString = function(){
        return "Backward Jump State: " + jumpTimeElapsed;
      };
      
    }
    return BackwardJumpState;
  }());


  
  
  //
  //
  var Player = (function(){
    
    function Player(){
      var health = 100;

      var idleState    = new IdleState(this);
      var blockState   = new BlockState(this);
      var jumpState    = new JumpState(this);
      var punchState   = new PunchState(this);
      var kickState    = new KickState(this);
      var deadState    = new DeadState(this);
      var recoverState = new RecoverState(this);
      var moveForwardState   = new MoveForwardState(this);
      var moveBackwardState  = new MoveBackwardState(this);
      var throwFireBallState = new ThrowFireBallState(this);
      var spinState          = new SpinState(this);
      var frozenState        = new FrozenState(this);
      
      var forwardJumpState = new ForwardJumpState(this);
      var backwardJumpState = new BackwardJumpState(this);

      
      // start in an idle state.
      state = idleState;
      
      this.moveForward = function(){
        state.moveForward && state.moveForward();
      };
      
      this.forwardJump = function(){
        state.forwardJump && state.forwardJump();
      }
      
      this.moveBackward = function(){
        state.moveBackward && state.moveBackward();
      };
      
      this.stopMoveForward = function(){
        if(state === moveForwardState){
          state = idleState;
        }
      }

      this.stopMoveBackward = function(){
        if(state === moveBackwardState){
          state = idleState;
        }
      }
      
      this.jump = function(){
        state.jump && state.jump();
      };
      
      this.idle = function(){
        state.idle && state.idle();
      };
      
      this.block = function(){
        state.block && state.block();
      };
      
      this.punch = function(){
        state.punch && state.punch();
      };
      
      this.kick = function(){
        state.kick && state.kick();
      };
      
      this.throwFireBall = function(){
        state.throwFireBall && state.throwFireBall();
      };
      
      this.dead = function(){
        state.dead && state.dead();
      }
      
      this.setState = function(s){
        state = s;
        console.log('state changed: ' + s.toString());
      };
      
      this.update = function(t, pc){
        state.update(t, pc);
        printd('debug', this.toString());
        //"Health: " + this.getHealth() + " , " + state.toString()
      }
      
      // smack the player with something
      this.hit = function(t, pc){
        state.hit && state.recover();
      }
      
      this.spin = function(t, pc){
        state.spin && state.spin(t, pc);
      }
      
      this.freeze = function(t, pc){
        state.freeze && state.freeze();
      }
      
      this.stop = function(){
        state = idleState;
      };
      
      this.toString = function(){
        return "Player Health: " + this.getHealth() + " , " + state.toString();
      };
      
      this.getHealth = function(){
        return health;
      }
      
      //
      this.setHealth = function(h){
        health = h;
        
        if(health < 0){
          health = 0;
        }
        else if(health > 100){
          health = 100;
        }
      }
      
      // convert to getters
      this.getIdleState    = function(){return idleState;};
      this.getBlockState   = function(){return blockState;};
      this.getJumpState    = function(){return jumpState;};
      this.getPunchState   = function(){return punchState;};
      this.getKickState    = function(){return kickState;};
      this.getDeadState    = function(){return deadState;};
      this.getRecoverState = function(){return recoverState;}
      this.getSpinState    = function(){return spinState;};
      this.getFrozenState  = function(){return frozenState;};
      
      this.getThrowFireBallState = function(){return throwFireBallState;};
      this.getMoveForwardState   = function(){return moveForwardState;};
      this.getMoveBackwardState  = function(){return moveBackwardState;};
      
      this.getForwardJumpState  = function(){return forwardJumpState;};
      this.getBackwardJumpState = function(){return backwardJumpState;}; 
    }
    
    return Player;
  }());



  var canvas = document.getElementById("test-canvas");
  var resources = {};

  var game = function (engine) {
      var space;
      var math = engine.math;

      function colladaLoader(url, onsuccess, onfailure) {
        // XXX figure out why this is necessary
        window.CubicVR = engine.graphics.target.context;

        try {
          var context = engine.graphics.target.context;
          var scene = context.loadCollada(url, "city");
          onsuccess(scene);
        } catch (e) {
          onfailure(e);
        }
      }

        // PlayerComponent
        var PlayerComponent = engine.base.Component({
            type: 'Player',
            depends: ['Transform', 'Model']    // We're going to do some rotation, so we should have a transform
        },
        function( options ) {
            options = options || {};
            var that = this;
            var player = new Player();
            // var player2 = new Player2();
            var service = engine.logic; // This is a hack so that this component will have its message queue processed

            this.onStartMoveForward = function( event ) { player.moveForward();};
            this.onStopMoveForward = function( event )  { player.stopMoveForward();};
            this.onStartMoveBackward = function( event ){ player.moveBackward();};
            this.onStopMoveBackward = function( event ) { player.stopMoveBackward();};
            
            this.onStartBlock = function( event ){
              player.block();
              
              // test code, remove
              var test = player.getHealth();
              test -= 50;
              player.setHealth(test);
            };
            
            this.onStopBlock = function( event ){player.idle();};

            this.onPunch = function( event )   { player.punch();};
            this.onKick = function( event )    { player.kick();};
            this.onJump = function( event )    { player.jump();};
            this.onThrowFireBall = function(event ){player.throwFireBall();}
            this.onKill = function( event ){player.dead();};
            this.onSpin = function( event ){player.spin();};
            
            this.onUpdate = function( event ) {
            
                // don't move the user if they're trying to move in both directions.
                if(keyStates.RIGHT && keyStates.LEFT){
                  player.idle();
                }
                // move them right if released the left key.
                else if(keyStates.RIGHT){
                   player.moveForward();
                }
                // move them left if they released the right key.
                else if(keyStates.LEFT){
                   player.moveBackward();
                }
                
                var transform = this.owner.find( 'Transform' );
                var test = this.owner.find( 'Model' );
                var delta = service.time.delta/1000;

                player.update(delta, transform);
                
            };// onUpdate

            // Boilerplate component registration; Lets our service know that we exist and want to do things
            this.onComponentOwnerChanged = function( e ){
                if( e.data.previous === null && this.owner !== null ) {
                    service.registerComponent( this.owner.id, this );
                }

                if( this.owner === null && e.data.previous !== null ) {
                    service.unregisterComponent( e.data.previous.id, this );
                }
            };

            this.onEntityManagerChanged = function( e ) {
                if( e.data.previous === null && e.data.current !== null && this.owner !== null ) {
                    service.registerComponent( this.owner.id, this );
                }

                if( e.data.previous !== null && e.data.current === null && this.owner !== null ) {
                    service.unregisterComponent( this.owner.id, this );
                }
            };
            
        });// PlayerComponent
            


      
      var run = function () {

          canvas = engine.graphics.target.element;
                        
            new space.Entity({
              name: 'player2',
              components: [
                new engine.core.component.Transform({
                  position: math.Vector3( -50, 8, 20 ),
                  rotation: math.Vector3( 0, 0, 0 ),
                  scale: math.Vector3(0.1,3.5, 2)
                }),
                new engine.graphics.component.Model({
                  mesh: resources.mesh,
                  material: resources.material
                })
                ]
                });                     
                      
            new space.Entity({
              name: 'player',
              components: [
                new engine.core.component.Transform({
                  position: math.Vector3( -50, 8, 35 ), // in front of red house.
                  rotation: math.Vector3( 0, 0, 0 ),
                  
                  // this is about the width height ratio of the sprites.
                  scale: math.Vector3(0.1, 3.5, 1.8)
                }),
                new engine.graphics.component.Model({
                  mesh: resources.mesh,
                  material: resources.material
                }),
                
                
                new engine.input.component.Controller({
                  onKey: function(e) {
                  
                    // keep state of the keys
                    var keyName = e.data.code;
                    keyStates[keyName] = (e.data.state === 'down');
                  
                    switch(e.data.code){
                    
                      // walk right
                      case 'RIGHT':
                        new engine.core.Event({
                          type: e.data.state === 'down' ? 'StartMoveForward' : 'StopMoveForward'
                        }).dispatch( [this.owner] );
                      break;
                      
                      // walk left
                      case 'LEFT':
                        new engine.core.Event({
                          type: e.data.state === 'down' ? 'StartMoveBackward' : 'StopMoveBackward'
                        }).dispatch( [this.owner] );
                      break;
                      
                      // jump
                      case 'UP':
                        new engine.core.Event({
                          type: 'Jump'
                        }).dispatch( [this.owner] );
                      break;
                      
                      // crouch?
                      //case 'DOWN':
                      //break;
                      
                      //Ppunch
                      case 'A':
                        new engine.core.Event({
                          type: 'Punch'
                        }).dispatch( [this.owner] );
                      break;

                      // Kick
                      case 'S':
                        new engine.core.Event({
                          type: 'Kick'
                        }).dispatch( [this.owner] );
                      break;
                      
                      // Block
                      case 'D':
                        new engine.core.Event({
                          type: e.data.state === 'down' ? 'StartBlock' : 'StopBlock'
                        }).dispatch( [this.owner] );
                      break;
                      
                      // Fireball!
                      case 'F':
                        new engine.core.Event({
                          type: 'ThrowFireBall'
                        }).dispatch( [this.owner] );
                      break;
                      
                      // Spin player
                      case 'W':
                      new engine.core.Event({
                          type: 'Spin'
                        }).dispatch( [this.owner] );
                      break;
                      
                      // Kill player
                      case 'X':
                        new engine.core.Event({
                          type: 'Kill'
                        }).dispatch( [this.owner] );
                      break;
                      
                      // hit player with something
                      //case 'Q':
                      //break;

                    }//switdh
                  }//onKey
                }),//controller
                new PlayerComponent()   
              ]
            });
      
          var camera = new space.Entity({
            name: 'camera',
            components: [
            new engine.core.component.Transform({
              position: math.Vector3(-33, 15, 30)
            }), new engine.graphics.component.Camera({
              active: true,
              width: canvas.width,
              height: canvas.height,
              fov: 60
            })]
          });
          camera.find('Camera').target = math.Vector3(-60, 10, 30);

          var task = new engine.scheduler.Task({
            schedule: {
              phase: engine.scheduler.phases.UPDATE,
            },
            callback: function () {}
          });

          // Start the engine!
          engine.run();
        };

      engine.core.resource.get([{
        type: engine.core.resource.Collada,
        url: "city/intro_city-anim.dae",
        load: colladaLoader,
        onsuccess: function (instance) {
          space = instance.space;
        },
        onfailure: function (error) {
          console.log("error loading collada resource: " + error);
        }
      },
      
      {type: engine.graphics.resource.Mesh,
        url: 'procedural-mesh.js',                          
        load: engine.core.resource.proceduralLoad,
        onsuccess: function( mesh ) {
            resources['mesh'] = mesh;
        },
        onfailure: function( error ) {}
        },
        {
            type: engine.graphics.resource.Material,
            url: 'procedural-material.js',
            load: engine.core.resource.proceduralLoad,
            onsuccess: function( material ) {
                resources['material'] = material;
            },
            onfailure: function( error ) {
            }
        },
        
        // test material which doesn't seem to work
        {
         type: engine.graphics.resource.Material,
         url: 'procedural-material-walk.js',
         load: engine.core.resource.proceduralLoad,
         onsuccess: function( material ) {
             resources['materialwalk'] = material;
         },
         onfailure: function( error ) {
         }
        },

        
        
        
        
      ], {
        oncomplete: run
      });
    };

  gladius.create({
    debug: true,
    services: {
      graphics: {
        src: 'graphics/service',
        options: {
          canvas: canvas
        }
      },
      input: {
        src: 'input/service',
        options:{
        }
      },
       logic: 'logic/game/service'
    }
  }, game);

});