/**
  Simple fighting game based on the "No Comply" WebGL video.
*/
document.addEventListener("DOMContentLoaded", function (e) {

  var canvas = document.getElementById("test-canvas");
  var resources = {};

  // XXX fix me
  var thugAction = 'idle';

  //
  var game = function (engine) {

      //////////////////
      // Player config
      /////////////////
      var playerOneConfig = {
        RIGHT_KEY: 'RIGHT',
        LEFT_KEY: 'LEFT',
        JUMP_KEY: 'UP',
        CROUCH_KEY: 'DOWN',
        name: 'player1'
      };

      var playerTwoConfig = {
        RIGHT_KEY: 'L',
        LEFT_KEY: 'J',
        JUMP_KEY: 'I',
        CROUCH_KEY: 'K',
        name: 'player2'
      };


      //////////////////////
      // Debugging
      //////////////////////
      var printd = function (div, str) {
          var el = document.getElementById(div);
          if (el) {
            el.innerHTML = str + '<p>';
          }
      };
      var cleard = function (div) {
          document.getElementById(div).innerHTML = '';
      };


      var space;
      var math = engine.math;

      const LEFT_BORDER = 40;
      const RIGHT_BORDER = 19;
      const MOVE_SPEED = 15;
      const FLOOR_POS = 8;
      const JUMP_HEIGHT = 35;
      const GRAVITY = 0.98;
      // Global state of the keyboard.
      var keyStates = [];




      ///////////////
      ///////////////
      function colladaLoader(url, onsuccess, onfailure) {
        // XXX figure out why this is necessary
        window.CubicVR = engine.graphics.target.context;

        try {
          var context = engine.graphics.target.context;
          var scene = context.loadCollada(url, "city");
          onsuccess(scene);
        }
        catch (e) {
          onfailure(e);
        }
      }


      // Thanks to the NoComply demo's CubicVR-bitmap_cube_array.js' for the
      // BitwallModel code
      var BitwallModel = engine.base.Component({
        type: 'Model',
        depends: ['Transform']
      }, function (options) {
        options = options || {};
        var _this = this;
        var service = engine.graphics;
        var gl = CubicVR.GLCore.gl;

        var _sprite = options.sprite;
        var _mesh = new engine.graphics.resource.Mesh();
        var _cvrmesh = _mesh._cvr.mesh;
        var _material;
        var tex = new CubicVR.Texture();

        function _updateTexture(action) {
          gl.bindTexture(gl.TEXTURE_2D, CubicVR.Textures[tex.tex_id]);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _sprite[action].frame());
          gl.bindTexture(gl.TEXTURE_2D, null);
        }

        var _action = options.action || null;
        this.updateAction = function (action) {
          _action = action;
          _updateTexture(action);
        };

        function buildMaterial() {

          // create an empty texture
          tex.setFilter(CubicVR.enums.texture.filter.NEAREST);
          tex.use();
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

          _updateTexture(thugAction);
          _material = new engine.graphics.resource.Material({
            color: [1, 1, 1],
            textures: {
              color: tex
            }
          });
        }

        function buildMesh() {
          var _cvrmat = _material._cvr.material;

          var tmpMesh = new CubicVR.Mesh();

          var trans = new CubicVR.Transform();

          trans.clearStack();
          trans.scale([1, 1, 1]);

          CubicVR.genPlaneObject(tmpMesh, 1.0, _cvrmat);

          tmpMesh.faces[0].uvs = [
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0]
          ];
          tmpMesh.faces[1].uvs = [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0]
          ];

          var is = 0.1 / 8.0;

          // create outside faces first to help with Early-Z
          trans.clearStack();
          trans.translate([0, 0, -0.05]);
          _cvrmesh.booleanAdd(tmpMesh, trans);
          trans.clearStack();
          trans.translate([0, 0, 0.05]);
          _cvrmesh.booleanAdd(tmpMesh, trans);

          var p;

          for (var i = -0.05 + is; i < 0.05 - is; i += is) {
            trans.clearStack();
            trans.translate([0, 0, i]);
            _cvrmesh.booleanAdd(tmpMesh, trans);
            p++;
          }

          _cvrmesh.calcNormals();
          _cvrmesh.triangulateQuads();
          _cvrmesh.compile();
        }

        buildMaterial();
        buildMesh();

        Object.defineProperty(this, "mesh", {
          enumerable: true,
          get: function () {
            return _mesh;
          }
        });

        this.onComponentOwnerChanged = function (e) {
          if (e.data.previous === null && this.owner !== null) {
            service.registerComponent(this.owner.id, this);
          }

          if (this.owner === null && e.data.previous !== null) {
            service.unregisterComponent(e.data.previous.id, this);
          }
        };

        this.onEntityManagerChanged = function (e) {
          if (e.data.previous === null && e.data.current !== null && this.owner !== null) {
            service.registerComponent(this.owner.id, this);
          }

          if (e.data.previous !== null && e.data.current === null && this.owner !== null) {
            service.unregisterComponent(this.owner.id, this);
          }
        };

        this.prepare = function () {
          if (_mesh && _material && _mesh._cvr && _material._cvr) {
            _mesh.prepare({
              material: _material
            });
          } //if
        };
        //prepare
        _this.prepare();

      });




      // PlayerComponent
      var PlayerComponent = engine.base.Component({
        type: 'Player',
        depends: ['Transform', 'Model'] // We're going to do some rotation, so we should have a transform
      }, function (options) {
        options = options || {};
        var that = this;
        
        //////////////////////
        // Character states
        //////////////////////
        /**
         */
        var IdleState = (function () {

          function IdleState(player) {

            var pl = player;

            this.moveForward = function () {
              pl.setState(pl.getMoveForwardState());
            };
            this.moveBackward = function () {
              pl.setState(pl.getMoveBackwardState());
            };
            this.jump = function () {
              pl.setState(pl.getJumpState());
            };
            this.idle = function () {}; //console.log('already idle');
            this.block = function () {
              pl.setState(pl.getBlockState());
            };
            this.punch = function () {
              pl.setState(pl.getPunchState());
            };
            this.kick = function () {
              pl.setState(pl.getKickState());
            };
            this.throwFireBall = function () {
              pl.setState(pl.getThrowFireBallState());
            };
            this.spin = function () {
              pl.setState(pl.getSpinState());
            };

            this.dead = function () {
              pl.setState(pl.getDeadState());
            }

            this.update = function (t, pc) {
              thugAction = 'idle';
              if (pl.speed[1] === 0)
                pl.speed[0] = 0;
              // When the character is idle, we may want to switch between
              // two images so they don't look so static.
            };

            this.toString = function () {
              return "Idle State";
            };
          }

          return IdleState;
        }());

        /**
          Character is spinning around and can get hit by the other player.
        */
        var SpinState = (function () {

          function SpinState(player) {

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
            this.spin = function(){};*/

            this.dead = function () {
              pl.setState(pl.getDeadState());
            }

            // Should we slow down the character?
            this.update = function (t, pc) {

              timeElapsed += t;
              var rot = pc.rotation;

              // rotate the sprite very fast          
              if (timeElapsed < 2) {
                rot[1] += 15;
                pc.rotation = rot;
              }
              else {
                timeElapsed = 0;

                // re-orient the character
                rot[1] = 3.14159/2;
                pc.rotation = rot;

                pl.setState(pl.getIdleState());
              }

            };

            this.toString = function () {
              return "Spin State: " + (2 - timeElapsed);
            };
          }

          return SpinState;
        }());

        /**
          Character is frozen and can get hit by the other player.
        */
        var FrozenState = (function () {

          function FrozenState(player) {

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
            this.freeze = function(){}*/

            this.dead = function () {
              pl.setState(pl.getDeadState());
            }

            // Should we slow down the character?
            this.update = function (t, pc) {
              timeElapsed += t;
            };

            this.toString = function () {
              return "Frozen State: " + (2 - timeElapsed);
            };
          }

          return FrozenState;
        }());

        /**
          Users can't transition to another state from the dead state.
        */
        var DeadState = (function () {

          function DeadState(player) {
            var pl = player;

            /*this.moveForward = function(){};
            this.moveBackward = function(){};
            this.jump = function(){};
            this.idle = function(){};
            this.block = function(){};
            this.punch = function(){};
            this.kick = function(){};*/

            this.update = function (t, pc) {
              pc.rotation
            };

            this.toString = function () {
              return "Dead State";
            };

          }

          return DeadState;
        }());

        /**
         */
        var BlockState = (function () {

          function BlockState(player) {
            var pl = player;

            /*this.moveForward = function(){console.log('cant move if blocking');};
            this.moveBackward = function(){console.log('cant move if blocking');};
            this.jump = function(){console.log('cant jump if blocking');};    
            this.block = function(){console.log('already blocking');};
            this.punch = function(){console.log('cant punch if blocking');};
            this.kick = function(){console.log('cant kick if blocking');};*/

            this.idle = function () {
              pl.setState(pl.getIdleState());
            };
            this.dead = function () {
              pl.setState(pl.getDeadState());
            }

            this.update = function (t) {};

            this.toString = function () {
              return "Block State";
            };
          }

          return BlockState;
        }());


        /**
         */
        var ThrowFireBallState = (function () {

          function ThrowFireBallState(player) {
            var pl = player;
            var fireBallTimeElapsed = 0;

            /*this.moveForward = function(){};
            this.moveBackward = function(){};
            this.jump = function(){};
            this.idle = function(){};
            this.block = function(){};
            this.punch = function(){};
            this.kick = function(){};*/

            this.spin = function () {
              pl.setState(pl.getSpinState());
            };

            this.dead = function () {
              pl.setState(pl.getDeadState());
            }

            this.update = function (t, pc) {
              fireBallTimeElapsed += t;

              if (fireBallTimeElapsed > 1) {
                fireBallTimeElapsed = 0;
                pl.setState(pl.getIdleState());
              }
            };

            this.toString = function () {
              return "Throw Fire Ball State";
            };

          }

          return ThrowFireBallState;
        }());

        /**
         */
        var PunchState = (function () {

          function PunchState(player) {
            var pl = player;
            var punchTimeElapsed = 0;

            /*this.moveForward = function(){console.log('cant move forward if punching');};
            this.moveBackward = function(){console.log('cant move forward if punching');};
            this.jump = function(){console.log('cant jump if punching');};
            this.idle = function(){console.log('cant idle if punching');};
            this.block = function(){console.log('cant block if punching');};
            this.punch = function(){console.log('already punching');};
            this.kick = function(){console.log('cant kick if punching');};*/

            // XXX
            // If a character is punching, can they be spun? Wouldn't they
            // run into the punch?
            //this.spin
            this.dead = function () {
              pl.setState(pl.getDeadState());
            }

            this.update = function (t, pc) {
              punchTimeElapsed += t;
              if (punchTimeElapsed > 0.5) {
                punchTimeElapsed = 0;
                pl.setState(pl.getIdleState());
              }
            };

            this.toString = function () {
              return "Punch State";
            };

          }

          return PunchState;
        }());

        /**
         */
        var KickState = (function () {

          function KickState(player) {
            var pl = player;
            var kickTimeElapsed = 0;

            /*this.moveForward = function(){console.log('cant move forward if kicking');};
            this.moveBackward = function(){console.log('cant move backward if kicking');};
            this.jump = function(){console.log('cant jump if kicking');};
            this.idle = function(){p.setState('cant idle if kicking');};
            this.block = function(){console.log('cant block if kicking');};
            this.punch = function(){console.log('cant punch if kicking');};
            this.kick = function(){console.log('already kicking');};*/

            this.dead = function () {
              pl.setState(pl.getDeadState());
            }

            this.update = function (t) {
              kickTimeElapsed += t;
              if (kickTimeElapsed > 0.5) {
                kickTimeElapsed = 0;
                pl.setState(pl.getIdleState());
              }
            };

            this.toString = function () {
              return "Kick State";
            };

          }

          return KickState;
        }());

        /**
         */
        var MoveForwardState = (function () {

          function MoveForwardState(player) {
            var pl = player;

            this.moveForward = function () {
              //console.log('already moving forward');
            };
            this.moveBackward = function () {
              //console.log('already moving backward');
            };

            // XXX
            this.forwardJump = function () {
              pl.setState(pl.getForwardJumpState());
            };
            this.jump = function () {
              pl.setState(pl.getForwardJumpState());
            };

            this.idle = function () {
              pl.setState(pl.getIdleState());
            };
            this.block = function () {
              pl.setState(pl.getBlockState());
            };
            this.punch = function () {
              pl.setState(pl.getPunchState());
            };
            this.kick = function () {
              pl.setState(pl.getKickState());
            };
            this.throwFireBall = function () {
              pl.setState(pl.getThrowFireBallState());
            };
            this.dead = function () {
              pl.setState(pl.getDeadState());
            };

            this.spin = function () {
              pl.setState(pl.getSpinState());
            };

            this.update = function (t, pc) {

              // XXX
              thugAction = 'walk';

              pl.speed[0] = MOVE_SPEED;
            };

            this.toString = function () {
              return "Move Forward State";
            };
          }

          return MoveForwardState;
        }());

        /**
         */
        var MoveBackwardState = (function () {

          function MoveBackwardState(player) {
            var pl = player;

            this.moveForward = function () {};
            this.moveBackward = function () {};

            this.jump = function () {
              pl.setState(pl.getBackwardJumpState());
            };
            this.idle = function () {
              pl.setState(pl.getIdleState());
            };
            this.block = function () {
              pl.setState(pl.getBlockState());
            };
            this.punch = function () {
              pl.setState(pl.getPunchState());
            };
            this.kick = function () {
              pl.setState(pl.getKickState());
            };
            this.throwFireBall = function () {
              pl.setState(pl.getThrowFireBallState());
            };
            this.spin = function () {
              pl.setState(pl.getSpinState());
            };

            this.dead = function () {
              pl.setState(pl.getDeadState());
            }

            this.update = function (t, pc) {
              var pos = pc.position;
              thugAction = 'walk';

              pl.speed[0] = -MOVE_SPEED;
            };

            this.toString = function () {
              return "Move Backward State";
            };

          }

          return MoveBackwardState;
        }());

        /**
          Player is recovering from being hit. At this point they just need to wait until
          the character gets back up.
        */
        var RecoverState = (function () {

          function RecoverState(player) {
            var pl = player;

            /*this.moveForward = function(){};
            this.moveBackward = function(){};
            this.jump = function(){};
            this.idle = function(){};
            this.block = function(){};
            this.punch = function(){};
            this.kick = function(){};
            this.throwFireBall = function(){};*/

            this.dead = function () {
              pl.setState(pl.getDeadState());
            }

            this.update = function (t, pc) {
              // change sprite animation here of character getting back up.
            };

            this.toString = function () {
              return "Recover State";
            };

          }

          return RecoverState;
        }());


        /**
         */
        var JumpState = (function () {

          function JumpState(player) {
            var pl = player;
            var jumpTimeElapsed = 0;

            /*this.moveForward = function(){console.log('cant move forward if jumping');};
          this.moveBackward = function(){console.log('cant move backward if jumping');};
          this.jump = function(){console.log('already jumping');};
          this.idle = function(){console.log('cant idle while jumping');};
          this.block = function(){console.log('cant block if jumping');};
          this.punch = function(){alert('take care of this case!');};*/

            // XXX can they be spun?
            // XXX
            this.kick = function () {
              alert('fix me');
            };
            this.hit = function () {
              // XXX
              // fix me
            };


            this.dead = function () {
              pl.setState(pl.getDeadState());
            };

            this.onActivate = function() {
              if (pl.speed[1] === 0)
                pl.speed[1] = JUMP_HEIGHT;
            };
            
            this.update = function(t, pc){
              thugAction = 'jump-knock';
              
              jumpTimeElapsed += t;
              if (pc.position[1] === FLOOR_POS && jumpTimeElapsed >= 1)
               pl.setState(pl.getIdleState());
            };

            this.toString = function () {
              return "Jump State: " + jumpTimeElapsed;
            };

          }
          return JumpState;
        }());

        /**
        Character walks forward and jumps
        */
        var ForwardJumpState = (function () {

          function ForwardJumpState(player) {
            var pl = player;
            var jumpTimeElapsed = 0;

            /*this.moveForward = function(){console.log('cant move forward if jumping');};
          this.moveBackward = function(){console.log('cant move backward if jumping');};
          this.jump = function(){console.log('already jumping');};
          this.idle = function(){console.log('cant idle while jumping');};
          this.block = function(){console.log('cant block if jumping');};
          this.punch = function(){alert('take care of this case!');};*/

            // XXX
            this.kick = function () {
              alert('fix me');
            };
            this.hit = function () {
              // XXX
              // fix me
            };

            this.dead = function () {
              pl.setState(pl.getDeadState());
            };

            this.onActivate = function() {
              if (pl.speed[1] === 0)
                pl.speed[1] = JUMP_HEIGHT;
            };
            
            this.update = function(t, pc){
              thugAction = 'jump-knock';
              
              jumpTimeElapsed += t;
              if (pc.position[1] === FLOOR_POS && jumpTimeElapsed >= 1)
               pl.setState(pl.getIdleState());
            };

            this.toString = function () {
              return "Forward Jump State: " + jumpTimeElapsed;
            };

          }
          return ForwardJumpState;
        }());


        /**
        Character walks backward and jumps
        */
        var BackwardJumpState = (function () {

          function BackwardJumpState(player) {
            var pl = player;
            var jumpTimeElapsed = 0;

            /*this.moveForward = function(){console.log('cant move forward if jumping');};
          this.moveBackward = function(){console.log('cant move backward if jumping');};
          this.jump = function(){console.log('already jumping');};
          this.idle = function(){console.log('cant idle while jumping');};
          this.block = function(){console.log('cant block if jumping');};
          this.punch = function(){alert('take care of this case!');};*/

            // XXX
            this.kick = function () {
              alert('fix me');
            };
            this.hit = function () {
              // XXX
              // fix me
            };

            this.dead = function () {
              pl.setState(pl.getDeadState());
            };

            this.onActivate = function() {
              if (pl.speed[1] === 0)
                pl.speed[1] = JUMP_HEIGHT;
            };
            
            this.update = function(t, pc){
              thugAction = 'jump-knock';
              
              jumpTimeElapsed += t;
              if (pc.position[1] === FLOOR_POS && jumpTimeElapsed >= 1)
               pl.setState(pl.getIdleState());
            };

            this.toString = function () {
              return "Backward Jump State: " + jumpTimeElapsed;
            };

          }
          return BackwardJumpState;
        }());

        /////////////////
        //
        /////////////////
        var Player = (function () {

          function Player(options) {
            options = options || {};

            var health = options.health || 100;
            var playerName = options.name || "NoName";

            var idleState = new IdleState(this);
            var blockState = new BlockState(this);
            var jumpState = new JumpState(this);
            var punchState = new PunchState(this);
            var kickState = new KickState(this);
            var deadState = new DeadState(this);
            var recoverState = new RecoverState(this);
            var moveForwardState = new MoveForwardState(this);
            var moveBackwardState = new MoveBackwardState(this);
            var throwFireBallState = new ThrowFireBallState(this);
            var spinState = new SpinState(this);
            var frozenState = new FrozenState(this);

            var forwardJumpState = new ForwardJumpState(this);
            var backwardJumpState = new BackwardJumpState(this);

            this.speed = [ 0, 0 ];

            // start in an idle state.
            var state = idleState;

            this.getState = function () {
              return state;
            }

            this.moveForward = function () {
              state.moveForward && state.moveForward();
            };

            this.forwardJump = function () {
              state.forwardJump && state.forwardJump();
            }

            this.moveBackward = function () {
              state.moveBackward && state.moveBackward();
            };

            this.stopMoveForward = function () {
              if (state === moveForwardState) {
                state = idleState;
              }
            };

            this.stopMoveBackward = function () {
              if (state === moveBackwardState) {
                state = idleState;
              }
            };

            this.jump = function () {
              state.jump && state.jump();
            };

            this.idle = function () {
              state.idle && state.idle();
            };

            this.block = function () {
              state.block && state.block();
            };

            this.punch = function () {
              state.punch && state.punch();
            };

            this.kick = function () {
              state.kick && state.kick();
            };

            this.throwFireBall = function () {
              state.throwFireBall && state.throwFireBall();
            };

            this.dead = function () {
              state.dead && state.dead();
            };

            this.setState = function (s) {
              if (state !== s && s.onActivate)
                s.onActivate();
              state = s;
              console.log('state changed: ' + s.toString());
            };

            this.update = function (t, pc) {
              state.update(t, pc);
              var pos = pc.position;
              this.speed[1] -= GRAVITY * 100 * t;
              pos[1] += this.speed[1] * t;
              pos[2] -= this.speed[0] * t;
              this.stayInBounds(pos);
              pc.position = pos;
              printd(playerName, this.toString());
            };
      
            this.stayInBounds = function(pos) {
              if(pos[2] > LEFT_BORDER )
                pos[2] = LEFT_BORDER;
              if(pos[2] < RIGHT_BORDER )
                pos[2] = RIGHT_BORDER;
              if (pos[1] <= FLOOR_POS) {
                pos[1] = FLOOR_POS;
                this.speed[1] = 0;
              }
            };

            // smack the player with something
            this.hit = function (t, pc) {
              state.hit && state.recover();
            };

            this.spin = function (t, pc) {
              state.spin && state.spin(t, pc);
            };

            this.freeze = function (t, pc) {
              state.freeze && state.freeze();
            };

            this.stop = function () {
              state = idleState;
            };

            this.toString = function () {
              return "Player Health: " + this.getHealth() + " , " + state.toString();
            };

            this.getHealth = function () {
              return health;
            };

            //
            this.setHealth = function (h) {
              health = h;

              // Kill the player if the damaged is greater than they can withstand.
              if (health < 0) {
                player.dead();
                health = 0;
              }
              else if (health > 100) {
                health = 100;
              }
            };

            // convert to getters
            this.getIdleState = function () {
              return idleState;
            };
            this.getBlockState = function () {
              return blockState;
            };
            this.getJumpState = function () {
              return jumpState;
            };
            this.getPunchState = function () {
              return punchState;
            };
            this.getKickState = function () {
              return kickState;
            };
            this.getDeadState = function () {
              return deadState;
            };
            this.getRecoverState = function () {
              return recoverState;
            }
            this.getSpinState = function () {
              return spinState;
            };
            this.getFrozenState = function () {
              return frozenState;
            };
            this.getThrowFireBallState = function () {
              return throwFireBallState;
            };

            this.getMoveForwardState = function () {
              return moveForwardState;
            };
            this.getMoveBackwardState = function () {
              return moveBackwardState;
            };

            this.getForwardJumpState = function () {
              return forwardJumpState;
            };
            this.getBackwardJumpState = function () {
              return backwardJumpState;
            };
          }

          return Player;
        }());

        var player = new Player(options);

        var service = engine.logic; // This is a hack so that this component will have its message queue processed
        this.onStartMoveForward = function (event) {
          player.moveForward();
        };
        this.onStopMoveForward = function (event) {
          player.stopMoveForward();
        };
        this.onStartMoveBackward = function (event) {
          player.moveBackward();
        };
        this.onStopMoveBackward = function (event) {
          player.stopMoveBackward();
        };

        this.onStartBlock = function (event) {
          player.block();
        };

        this.onStopBlock = function (event) {
          player.idle();
        };

        this.onPunch = function (event) {
          player.punch();
        };
        this.onKick = function (event) {
          player.kick();
        };
        this.onJump = function (event) {
          player.jump();
        };
        this.onThrowFireBall = function (event) {
          player.throwFireBall();
        };

        this.onKill = function (event) {
          player.dead();
        };
        this.onSpin = function (event) {
          player.spin();
        };

        // XXX fix me
        this.getPlayer = function () {
          return player;
        }

        this.onUpdate = function (event) {
          var delta = service.time.delta / 1000;
          var transform = this.owner.find('Transform');

          // Don't move the user if they're trying to move in both directions.
          if (keyStates[options.RIGHT_KEY] && keyStates[options.LEFT_KEY]) {
            player.idle();
          }

          // Move them right if released the left key.
          else if (keyStates[options.RIGHT_KEY]) {
            player.moveForward();
          }

          // Move them left if they released the right key.
          else if (keyStates[options.LEFT_KEY]) {
            player.moveBackward();
          }

          player.update(delta, transform);
        }; // onUpdate
        // Boilerplate component registration; Lets our service know that we exist and want to do things
        this.onComponentOwnerChanged = function (e) {
          if (e.data.previous === null && this.owner !== null) {
            service.registerComponent(this.owner.id, this);
          }

          if (this.owner === null && e.data.previous !== null) {
            service.unregisterComponent(e.data.previous.id, this);
          }
        };

        this.onEntityManagerChanged = function (e) {
          if (e.data.previous === null && e.data.current !== null && this.owner !== null) {
            service.registerComponent(this.owner.id, this);
          }

          if (e.data.previous !== null && e.data.current === null && this.owner !== null) {
            service.unregisterComponent(this.owner.id, this);
          }
        };
      }); // PlayerComponent
      var run = function () {

          canvas = engine.graphics.target.element;

          /////////////
          // Fireball
          /////////////
          /*new space.Entity({
              name: 'fireball',
              components: [
                new engine.core.component.Transform({
                  position: math.Vector3( -50, 8, 35 ),
                  rotation: math.Vector3( 0, 0, 0 ),
                  scale: math.Vector3(0.1, 1.5, 1.5)
                }),
                new engine.graphics.component.Model({
                  mesh: resources.mesh,
                  material: resources.material
                })
              ]
            });*/


          ////////////                      
          // Player 2
          ////////////
          var player2 = new space.Entity({
            name: 'player2',
            components: [
            new engine.core.component.Transform({
              position: math.Vector3(-50, 8.7, 20),
              rotation: math.Vector3(0, -math.PI / 2, 0),
              scale: math.Vector3(4, 4, 4)
            }),

            new BitwallModel({
              sprite: viking.sprites.thug1
            }),

            new engine.input.component.Controller({
              onKey: function (e) {

                // keep state of the keys
                var keyName = e.data.code;
                keyStates[keyName] = (e.data.state === 'down');

                switch (e.data.code) {

                  // walk right
                case 'L':
                  new engine.core.Event({
                    type: e.data.state === 'down' ? 'StartMoveForward' : 'StopMoveForward'
                  }).dispatch([this.owner]);
                  break;

                  // walk left
                case 'J':
                  new engine.core.Event({
                    type: e.data.state === 'down' ? 'StartMoveBackward' : 'StopMoveBackward'
                  }).dispatch([this.owner]);
                  break;

                  // jump
                case 'I':
                  new engine.core.Event({
                    type: 'Jump'
                  }).dispatch([this.owner]);
                  break;

                  // Punch
                case 'Y':
                  new engine.core.Event({
                    type: 'Punch'
                  }).dispatch([this.owner]);
                  break;

                  // Kick
                case 'U':
                  new engine.core.Event({
                    type: 'Kick'
                  }).dispatch([this.owner]);
                  break;

                  // Block
                case 'B':
                  new engine.core.Event({
                    type: e.data.state === 'down' ? 'StartBlock' : 'StopBlock'
                  }).dispatch([this.owner]);
                  break;

                  // Fireball!
                case 'M':
                  new engine.core.Event({
                    type: 'ThrowFireBall'
                  }).dispatch([this.owner]);
                  break;

                  // Spin player
                case '1':
                  new engine.core.Event({
                    type: 'Spin'
                  }).dispatch([this.owner]);
                  break;

                } //switdh
              } //onKey
            }), //controller
            new PlayerComponent(playerTwoConfig)]
          });

          ////////////                      
          // Player 1
          ////////////
          var player1 = new space.Entity({
            name: 'player1',
            components: [
            new engine.core.component.Transform({
              position: math.Vector3(-50, 8.7, 35),
              // in front of red house.
              rotation: math.Vector3(0, math.PI / 2, 0),
              scale: math.Vector3(4, 4, 4)
            }), new BitwallModel({
              sprite: viking.sprites.thug1
            }), new engine.input.component.Controller({
              onKey: function (e) {

                // keep state of the keys
                var keyName = e.data.code;
                keyStates[keyName] = (e.data.state === 'down');

                switch (e.data.code) {

                  // walk right
                case 'RIGHT':
                  new engine.core.Event({
                    type: e.data.state === 'down' ? 'StartMoveForward' : 'StopMoveForward'
                  }).dispatch([this.owner]);
                  break;

                  // walk left
                case 'LEFT':
                  new engine.core.Event({
                    type: e.data.state === 'down' ? 'StartMoveBackward' : 'StopMoveBackward'
                  }).dispatch([this.owner]);
                  break;

                  // jump
                case 'UP':
                  new engine.core.Event({
                    type: 'Jump'
                  }).dispatch([this.owner]);
                  break;

                  // crouch?
                  //case 'DOWN':
                  //break;
                  // Punch
                case 'A':
                  new engine.core.Event({
                    type: 'Punch'
                  }).dispatch([this.owner]);
                  break;

                  // Kick
                case 'S':
                  new engine.core.Event({
                    type: 'Kick'
                  }).dispatch([this.owner]);
                  break;

                  // Block
                case 'D':
                  new engine.core.Event({
                    type: e.data.state === 'down' ? 'StartBlock' : 'StopBlock'
                  }).dispatch([this.owner]);
                  break;

                  // Fireball
                case 'F':
                  new engine.core.Event({
                    type: 'ThrowFireBall'
                  }).dispatch([this.owner]);
                  break;

                  // Spin player
                case 'W':
                  new engine.core.Event({
                    type: 'Spin'
                  }).dispatch([this.owner]);
                  break;

                  // Kill player
                case 'X':
                  new engine.core.Event({
                    type: 'Kill'
                  }).dispatch([this.owner]);
                  break;

                } //switdh
              } //onKey
            }), //controller
            new PlayerComponent(playerOneConfig)]
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

          // XXX the animation time of 10 is totally random.  It should actually
          // be something sane, probably picked to interact with the
          // simulationTime.delta and then that as well as the speed
          // that the spritesheet includes factored in.  I suspect this code
          // is gonna want some optimization too.
          var animationTime = 10;
          var animationTimer = 0;

          ////////////////
          // Task
          ////////////////
          var task = new engine.scheduler.Task({
            schedule: {
              phase: engine.scheduler.phases.UPDATE
            },
            callback: function () {
              var delta = engine.scheduler.simulationTime.delta / 1000;
              //bitwall.find('Transform').rotation = 
              //  math.matrix4.add([bitwall.find('Transform').rotation,
              //                   [0, math.TAU * delta * 0.1, 0]]);
              if (!animationTimer) {
                // XXX update animation
                player2.find('Model').updateAction(thugAction);
                player1.find('Model').updateAction(thugAction);

                // reset the timer
                animationTimer = animationTime;

              }
              else {
                --animationTimer;
              }
            }
          });


          //  var player1 = space.find('player1').find('Player').getPlayer();
          // If player1 is punching and player2 can get hit and player1's hitbox intersects player2's
          // if (..)
          // Start the engine!
          engine.run();
        };

        ////////////////
        // Load some sprites
        ////////////////
        viking.loadSprite('./sprites/thug1.sprite', {
          //callback: run
        });

      engine.core.resource.get([
      {
        type: engine.core.resource.Collada,
        url: "city/intro_city-anim.dae",
        load: colladaLoader,
        onsuccess: function (instance) {
          space = instance.space;
        },
        onfailure: function (error) {
          console.log("error loading collada resource: " + error);
        }
      }, {
        type: engine.graphics.resource.Mesh,
        url: 'procedural-mesh.js',
        load: engine.core.resource.proceduralLoad,
        onsuccess: function (mesh) {
          resources['mesh'] = mesh;
        },
        onfailure: function (error) {}
      }, {
        type: engine.graphics.resource.Material,
        url: 'procedural-material.js',
        load: engine.core.resource.proceduralLoad,
        onsuccess: function (material) {
          resources['material'] = material;
        },
        onfailure: function (error) {}
      }
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
        options: {}
      },
      logic: 'logic/game/service'
    }
  }, game);

});