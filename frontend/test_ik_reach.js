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
robotRoot.rotation.z = -Math.PI / 2; 
robotRoot.position.set(0, 0, 0);

function testAngles(j1z, j2y, j3y, j5y) {
    j1.rotation.z = j1z;
    j2.rotation.y = j2y;
    j3.rotation.y = j3y;
    j5.rotation.y = j5y;
    robotRoot.updateMatrixWorld(true);
    const loc = new THREE.Vector3();
    gripperCenter.getWorldPosition(loc);
    // console.log(`Angles (${j2y.toFixed(2)}, ${j3y.toFixed(2)}, ${j5y.toFixed(2)}) -> Y: ${loc.y.toFixed(3)}, X: ${Math.abs(loc.x).toFixed(3)}`);
    return {y: loc.y, x: Math.abs(loc.x)};
}

// We want Y = 0.138, X as large as possible.
// Try different combinations of j2y, j3y
let bestReach = 0;
let bestAngles = null;

for (let j2y = 0.5; j2y <= 1.5; j2y += 0.01) {
    for (let j3y = 0.0; j3y <= 1.5; j3y += 0.01) {
        for (let j5y = -2.0; j5y <= 0.0; j5y += 0.05) {
            let res = testAngles(-Math.PI / 2, j2y, j3y, j5y);
            if (Math.abs(res.y - 0.138) < 0.005) {
                if (res.x > bestReach) {
                    bestReach = res.x;
                    bestAngles = {j2y, j3y, j5y, y: res.y, x: res.x};
                }
            }
        }
    }
}
console.log("Max reach:", bestAngles);

// Also try to find a nice round number for X, like X=0.8
let targetX = 0.8;
let closestDiff = 999;
let targetAngles = null;
for (let j2y = 0.5; j2y <= 1.5; j2y += 0.01) {
    for (let j3y = 0.0; j3y <= 1.5; j3y += 0.01) {
        for (let j5y = -2.0; j5y <= 0.0; j5y += 0.05) {
            let res = testAngles(-Math.PI / 2, j2y, j3y, j5y);
            if (Math.abs(res.y - 0.138) < 0.005) {
                let diff = Math.abs(res.x - targetX);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    targetAngles = {j2y, j3y, j5y, y: res.y, x: res.x};
                }
            }
        }
    }
}
console.log(`Target X=${targetX}:`, targetAngles);

targetX = 1.0;
closestDiff = 999;
targetAngles = null;
for (let j2y = 0.5; j2y <= 1.5; j2y += 0.01) {
    for (let j3y = 0.0; j3y <= 1.5; j3y += 0.01) {
        for (let j5y = -2.0; j5y <= 0.0; j5y += 0.05) {
            let res = testAngles(-Math.PI / 2, j2y, j3y, j5y);
            if (Math.abs(res.y - 0.138) < 0.005) {
                let diff = Math.abs(res.x - targetX);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    targetAngles = {j2y, j3y, j5y, y: res.y, x: res.x};
                }
            }
        }
    }
}
console.log(`Target X=${targetX}:`, targetAngles);
