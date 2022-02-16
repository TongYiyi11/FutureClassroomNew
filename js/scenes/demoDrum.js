import * as THREE from '../../node_modules/three/build/three.module.js';
import * as cg from "../render/core/cg.js";
import { controllerMatrix, buttonState } from "../render/core/controllerInput.js";
import PositionalAudioPolyphonic from "../third-party/PositionalAudioPolyphonic.js";

let objNum = 0;        // number of objects
let target = null;     // target obj to be transformed
let targetBox = null;  // target box
let prevPosR = null;   // previous position of right controller
let movMode = false;   // translation mode
let rotMode = false;   // rotation mode
let isPlay = false;
let stickL = null;
let stickR = null;
let audioLoader = null;
let listener = null;

const IDENTITY = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

export const init = async model => {
    model.control('p', 'play', () => {
        if(isPlay){
            model.remove(stickL);
            model.remove(stickR);
        }
        isPlay = !isPlay
    });
    model.setTable(false);

    audioLoader = new THREE.AudioLoader();
    listener = new THREE.AudioListener();

    // Stands
    for(let i = 0; i < 4; i++){
        let stand = model.add().move(i, 0, 0.5);

        // vertical stand
        let ylen = 0.5;
        if(i === 0){
            ylen = 0.3;
        }
        let standVT = stand.add().move(0, ylen, 0);
        let standVR = standVT.add();
        standVR.add('tubeY').scale(0.015, ylen, 0.015).texture('media/textures/metal.png');

        for(let j = 0; j < 3; j++){

            // horizontal stand
            let standH = stand.add();
            let rad = 2 * Math.PI / 3 * j;
            let hLen = 0.15;
            let zDir = [Math.sin(rad), 0, Math.cos(rad)];
            // component 1
            let h1T = standH.add().move(zDir[0] * hLen / 2,0.03,zDir[2] * hLen / 2)
            let h1R = h1T.add().aimZ(zDir);
            h1R.add('tubeZ').scale(0.01, 0.01, hLen).texture('media/textures/metal.png');
            // component 2
            let h2T = standH.add().move(zDir[0] * hLen * 1.7,0.01,zDir[2] * hLen * 1.7);
            let h2R = h2T.add();
            h2R.add('cube').scale(.02).color(0.2, 0.2, 0.2);

            // support
            let vLen = 0.13;
            let yDir = [0,1,0];
            let sLen = Math.sqrt(vLen * vLen + hLen * hLen);
            let supportT = stand.add().move(zDir[0] * hLen, vLen / 1.15, zDir[2] * hLen);
            let supportR = supportT.add().aimY(cg.mix(yDir, zDir, 1, -1));
            supportR.add('tubeY')
                .scale(0.01, sLen, 0.01)
                .texture('media/textures/metal.png');
        }
    }

    // Cymbals
    for(let i = 0; i < 3; i++){
        let cymbalT = model.add().move(i + 1, 0.05, 0);
        let cymbalR = cymbalT.add();
        cymbalR.add('tubeY').scale(0.3, .005, 0.3)
            .texture('media/textures/gold_metal.png')
            .setAudio(loadSound('media/sound/drums/cymbal_sound.ogg'));
    }

    // Bass Drum
    let bassDrum = model.add().move(1, 0.4, -1.5);
    // drum
    let drumT = bassDrum.add();
    let drumR = drumT.add();
    drumR.add('tubeZ').scale(0.4, 0.4, 0.13)
        .texture('media/textures/texture0.png')
        .setAudio(loadSound('media/sound/drums/bass_drum.ogg'));

    // connect 1
    let cn1T = bassDrum.add().move(0, 0.5, 0);
    let cn1R = cn1T.add();
    cn1R.add('tubeY').scale(0.01, 0.15, 0.01).texture('media/textures/wood.png');
    // connect 2
    let cn2T = bassDrum.add().move(0, 0.65, 0);
    let cn2R = cn2T.add();
    cn2R.add('tubeX').scale(0.15, 0.01, 0.01).texture('media/textures/wood.png');
    // support
    let lis = [-1, 1];
    for(let i = 0; i < lis.length; i++){
        // component 1
        let sp1T = bassDrum.add().move(-lis[i]*0.5, -0.25, 0);
        let sp1R = sp1T.add().aimY([lis[i],1,0]);
        sp1R.add('tubeY').scale(0.01, 0.22, 0.01).texture('media/textures/metal.png');
        // component 2
        let sp2T = bassDrum.add().move(-lis[i]*0.64, -0.38, 0);
        let sp2R = sp2T.add();
        sp2R.add('cube').scale(.02).color(0.2, 0.2, 0.2);
    }

    // Toms
    for(let i = 0; i < 4; i++){
        let r = 0.2;
        let h = 0.25;
        let snd = 'media/sound/drums/tribal_drum.ogg';
        let txt = 'media/textures/texture1.png';
        if(i == 0){
            r = 0.25;
            h = 0.4;
            snd = 'media/sound/drums/dry_drum.ogg';
            txt = 'media/textures/texture3.png';
        }
        if(i == 3){
            h = 0.1;
            snd = 'media/sound/drums/soft_drum.ogg';
            txt= 'media/textures/texture2.png';
        }
        let tomT = model.add().move(i, r, -0.5);
        let tomR = tomT.add();
        tomR.add('tubeY').scale(r, h, r)
            .texture(txt)
            .setAudio(loadSound(snd));
    }

    objNum = model._children.length;

}

export const display = model => {
    model.animate(() => {

        // GET THE CURRENT MATRIX AND TRIGGER INFO FOR BOTH CONTROLLERS
        let matrixL  = controllerMatrix.left;
        let matrixR  = controllerMatrix.right;
        let rightSqueeze  = buttonState.right[0].pressed;   // squeeze in WebXR! (Trigger in VR) for move
        let rightSelect = buttonState.right[1].pressed;     // squeeze in VR! for rotation
        //let rightSelect = buttonState.right[3].pressed;   // select in WebXR! for rotation
        let rightJoyTouch = buttonState.right[3].touched;   // change to play mode in VR

        // calibrate the controller matrix
        let LM = cg.mMultiply(matrixL, cg.mTranslate( .006,0,0));
        let RM = cg.mMultiply(matrixR, cg.mTranslate(-.001,0,0));

        // check VR mode
        if(LM.length > 0) isPlay = rightJoyTouch;

        // move object
        if(rightSqueeze){
            movMode = true;

            // find the target obj to be moved
            if(target == null){
                target = intersectObj(model, IDENTITY, RM, [0, 0, 0]);
                targetBox = findBox(target);
            }

            // translation
            if(target != null){
                console.log('hit');
                if(prevPosR == null){
                    prevPosR = RM.slice(12, 15);   // previous pos of controller
                }
                let curPosR = RM.slice(12, 15);    // current pos of controller
                let diff = cg.mix(curPosR, prevPosR, 1, -1);
                let transMat = targetBox.getMatrix();
                targetBox.setMatrix(cg.mMultiply(cg.mTranslate(diff), transMat));
                prevPosR = curPosR;
            }

        }else if(movMode){
            // reset
            movMode = false;
            target = null;
            targetBox = null;
            prevPosR = null;
        }

        // rotate object
        if(rightSelect){
            rotMode = true;

            // find the target obj to be rotated
            target = intersectObj(model, IDENTITY, RM, [0, 0, 0]);

            // rotation
            if(target != null){
                console.log('hit');
                targetBox = findBox(target);
                let transMat = cg.mTranslate([0,0,-0.1]);
                targetBox.setMatrix(cg.mMultiply(RM, transMat));
            }
        }else if(rotMode){
            // reset
            rotMode = false;
            target = null;
            targetBox = null;
        }

        // play drum
        if(isPlay){
            let stickLen = 0.4;
            // set stick position
            if(stickL == null){
                console.log('stickL on');
                stickL = model.add();
                stickL.add('tubeZ').move(0,0,-0.3).scale(.014,.014,stickLen).texture('media/textures/wood.png');
            }
            if(stickR == null){
                stickR = model.add();
                stickR.add('tubeZ').move(0,0,-0.3).scale(.014,.014,stickLen).texture('media/textures/wood.png');
            }
            stickL.setMatrix(LM);
            stickR.setMatrix(RM);

            // check intersection
            let transMat = cg.mMultiply(cg.mTranslate([0,0,-0.5]), stickR.child(0).getMatrix());
            let hitObjR = intersectObj(model, IDENTITY, cg.mMultiply(RM, transMat));
            let hitObjL = intersectObj(model, IDENTITY, cg.mMultiply(LM, transMat));
            if(hitObjR != null){
                console.log('hit right');
                // play sound
                if(hitObjR._audio != null){
                    hitObjR._audio.play();
                }
            }
            if(hitObjL != null){
                console.log('hit left');
                if(hitObjL._audio != null){
                    hitObjL._audio.play();
                }
            }
        }else{
            if(stickR != null){
                model.remove(stickR);
                model.remove(stickL);
                stickL = null;
                stickR = null;
            }
        }

    });
}


// traverse the tree using dfs and detect intersection
// input: transformation matrix of the object and controller, position of the controller
// output: the intersected object
let intersectObj = (root, TM, CM) => {
    TM = cg.mMultiply(TM, root.getMatrix());
    // leaf nodes
    if(root._children.length == 0){
        let hit = cg.mHitBox(CM, TM);
        if(hit && root._parent != stickL && root._parent != stickR){
            return root;
        }else{
            return null;
        }
    }
    // non-leaf nodes
    for(let i = 0; i < root._children.length; i++){
        let child = root.child(i);
        let obj = intersectObj(child, TM, CM);
        if(obj != null) return obj;
    }
    return null;
}

// find box of the object that is connected to the model
let findBox = node => {
    if(node == null) return null;
    let parent = node._parent;
    if(parent._parent == null){
        return node;
    }else{
        return findBox(parent);
    }
}

let loadSound = src => {
    let sound = new PositionalAudioPolyphonic(listener, 1);
    audioLoader.load(src, buffer => sound.setBuffer(buffer));
    return sound;
}


