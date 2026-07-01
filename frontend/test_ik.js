const THREE = require('three');

const robotRoot = new THREE.Group();
const j1 = new THREE.Group(); 
const j2 = new THREE.Group(); 
const j3 = new THREE.Group(); 
const j4 = new THREE.Group(); 
const j5 = new THREE.Group(); 
const j6 = new THREE.Group(); 
const gripperCenter = new THREE.Group(); 

robotRoot.add(j1);
j1.add(j2);
j2.add(j3);
j3.add(j4);
j4.add(j5);
j5.add(j6);
j6.add(gripperCenter);

j1.position.set(0, 0, 0);
j2.position.set(0, 0, 0.35); 
j3.position.set(0, 0, 0.16); 
j4.position.set(0, 0, 0);    
j5.position.set(0.35, 0, 0.12); 
j6.position.set(0, 0, 0);
gripperCenter.position.set(0.05, 0, 0); 

robotRoot.scale.set(5, 5, 5);
robotRoot.rotation.x = -Math.PI / 2; 
robotRoot.rotation.z = -Math.PI / 2; // Face X
robotRoot.position.set(0, 0, 0);

function testAngles(j1z, j2y, j3y, j5y) {
    j1.rotation.z = j1z;
    j2.rotation.y = j2y;
    j3.rotation.y = j3y;
    j5.rotation.y = j5y;
    robotRoot.updateMatrixWorld(true);
    const loc = new THREE.Vector3();
    gripperCenter.getWorldPosition(loc);
    console.log(`Angles (${j1z.toFixed(2)}, ${j2y.toFixed(2)}, ${j3y.toFixed(2)}, ${j5y.toFixed(2)}) -> Y: ${loc.y.toFixed(3)}, X: ${loc.x.toFixed(3)}, Z: ${loc.z.toFixed(3)}`);
}

// Sweep is from J1Val = 0 to 1 in the old code.
// j1.rotation.z = -j1Val * (Math.PI / 2);
testAngles(0, 1.1, 1.0, -1.4);
testAngles(-Math.PI / 2, 1.1, 1.0, -1.4);
testAngles(-Math.PI, 1.1, 1.0, -1.4);
