window.onerror = function(message, source, lineno, colno, error) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.zIndex = '99999';
    div.style.background = 'rgba(0,0,0,0.8)';
    div.style.color = 'red';
    div.style.padding = '20px';
    div.style.top = '0';
    div.style.left = '0';
    div.innerHTML = "JS ERROR: " + message + " at line " + lineno;
    document.body.appendChild(div);
};
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hero-robot-container');
  if (!container) return;

  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 3, 8); 
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false; 
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; 
  controls.minPolarAngle = 0.1;
  controls.target.set(0, 1.0, 0);

  // Hemisphere light grounds the robot: upward faces receive white, downward faces receive dark blue platform color
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x050810, 0.8);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2); 
  keyLight.position.set(5, 10, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048; // High-res shadow
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  keyLight.shadow.radius = 8; // Soft, realistic shadow edges
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x2962FF, 1.2); 
  rimLight.position.set(-5, 5, -5);
  scene.add(rimLight);
  
  // Platform and Grounding
  const platformGeo = new THREE.CylinderGeometry(2.5, 2.7, 0.2, 64);
  const platformMat = new THREE.MeshStandardMaterial({ 
    color: 0x050810, roughness: 0.8, metalness: 0.2 
  });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.y = -0.1;
  platform.receiveShadow = true;
  scene.add(platform);

  // Procedural Contact Shadow (Ambient Occlusion) for the base
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 512;
  shadowCanvas.height = 512;
  const ctx = shadowCanvas.getContext('2d');
  
  // Guarantee perfect transparency in the corners by clipping all drawing to a circle
  ctx.clearRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.clip();
  
  // 1. Broad Ambient Occlusion (Soft indirect lighting influence)
  const aoGradient = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
  aoGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)'); 
  aoGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.5)');
  aoGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)'); 
  aoGradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); 
  ctx.fillStyle = aoGradient;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Firm Contact Shadow (Sharp and dark at the exact base)
  const contactGradient = ctx.createRadialGradient(256, 256, 45, 256, 256, 120);
  contactGradient.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
  contactGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.6)');
  contactGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = contactGradient;
  ctx.fillRect(0, 0, 512, 512);

  // 3. Ultra-tight Grounding Line (Eliminates 'pasted-on' gap)
  const coreGradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 65);
  coreGradient.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
  coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coreGradient;
  ctx.fillRect(0, 0, 512, 512);
  
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(2.5, 2.5);
  const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
      blending: THREE.NormalBlending,
      toneMapped: false // Prevents WebGL tone mapping from brightening/darkening the transparent shadow edges
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.005; // Sit perfectly flush just above the platform
  scene.add(contactShadow);

  const floorGeo = new THREE.PlaneGeometry(20, 20);
  
  // Create a tightened radial alpha map to guarantee perfect symmetrical fading on ALL sides
  const floorAlphaCanvas = document.createElement('canvas');
  floorAlphaCanvas.width = 512;
  floorAlphaCanvas.height = 512;
  const floorCtx = floorAlphaCanvas.getContext('2d');
  
  // Platform radius is 2.5 units (approx 64 pixels). 
  // Start fading just inside the edge (60) and fade to transparent quickly (110)
  // This creates a soft skirt without rendering a massive dark box that clips the container!
  const floorGradient = floorCtx.createRadialGradient(256, 256, 60, 256, 256, 110);
  floorGradient.addColorStop(0, '#ffffff'); // Opaque center
  floorGradient.addColorStop(1, '#000000'); // Completely transparent
  floorCtx.fillStyle = floorGradient;
  floorCtx.fillRect(0, 0, 512, 512);
  const floorAlphaTex = new THREE.CanvasTexture(floorAlphaCanvas);

  // Match the platform material exactly so it acts as a seamless extension that softly fades into the background
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x050810, roughness: 0.8, metalness: 0.2,
    transparent: true, opacity: 0.5,
    alphaMap: floorAlphaTex,
    depthWrite: false
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.2;
  floor.receiveShadow = true;
  scene.add(floor);

  let robotSystem = null; 
  let component = null;
  const loader = new THREE.GLTFLoader();
  
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

  // Apply Mathematically Precise Pivot Offsets for Z-up Geometry
  j1.position.set(0, 0, 0);
  j2.position.set(0, 0, 0.35); // J2 Shoulder pivot
  j3.position.set(0, 0, 0.16); // J3 Elbow pivot: Z = 0.51 - 0.35
  j4.position.set(0, 0, 0);    
  j5.position.set(0.35, 0, 0.12); // J5 Wrist pivot: X=0.35, Z=0.63 - 0.51 = 0.12
  j6.position.set(0, 0, 0);
  
  // Gripper attachment point relative to J6
  gripperCenter.position.set(0.05, 0, 0); 

  loader.load(
    'models/robot.glb',
    (gltf) => {
      const spinner = document.getElementById('robotSpinner');
      if (spinner) spinner.style.display = 'none';

      const meshes = [];
      gltf.scene.traverse(child => {
        if (child.isMesh) {
          meshes.push(child);
        }
      });

      meshes.forEach((m, meshIndex) => {
        m.geometry = m.geometry.clone();
        m.geometry.computeBoundingBox();
        m.castShadow = true;
        m.receiveShadow = true;
        
        const isDark = m.material && m.material.color && m.material.color.getHSL({h:0,s:0,l:0}).l < 0.2;
        m.material = new THREE.MeshStandardMaterial({
          color: isDark ? 0x222222 : 0xffffff,
          roughness: 0.3,
          metalness: 0.1,
        });

        // Exact mesh assignment based on live Three.js traversal indices (0 to 28)
        if (meshIndex === 26 || meshIndex === 27) {
            // Skip ABB Logos
            return; 
        }

        if (meshIndex === 28) {
            // Component Cube (Replace with larger, bright custom box)
            m.visible = false;
            
            const boxGeo = new THREE.BoxGeometry(0.276, 0.276, 0.276);
            const boxMat = new THREE.MeshStandardMaterial({
                color: 0xff6600, 
                roughness: 0.2, 
                metalness: 0.1
            });
            component = new THREE.Mesh(boxGeo, boxMat);
            component.castShadow = true;
            component.receiveShadow = true;
            
            scene.add(component);
            return;
        }

        if (meshIndex <= 8 || meshIndex === 25) {
            // Base
            m.geometry.translate(0, 0, 0);
            robotRoot.add(m);
        }
        else if (meshIndex === 9) {
            // Yoke (J1)
            m.geometry.translate(0, 0, 0);
            j1.add(m);
        }
        else if (meshIndex >= 10 && meshIndex <= 12) {
            // Lower Arm (J2)
            m.geometry.translate(0, 0, -0.35); // J2 pivot
            j2.add(m);
        }
        else if (meshIndex >= 13 && meshIndex <= 22) {
            // Forearm & Motors (J3/J4)
            m.geometry.translate(0, 0, -0.51); // J3 pivot
            j3.add(m);
        }
        else if (meshIndex === 23 || meshIndex === 24) {
            // Flange & Gripper (J6)
            m.geometry.translate(-0.35, 0, -0.63); // J5/J6 pivot
            j6.add(m);
        }
      });

      const scale = 3.5 / 0.70; 
      robotRoot.scale.set(scale, scale, scale);
      
      // Stand up straight vertically!
      robotRoot.rotation.x = -Math.PI / 2; 
      robotRoot.rotation.z = -Math.PI / 2; // Face forward

      robotRoot.position.set(0, 0, 0);
      scene.add(robotRoot);
      robotSystem = robotRoot;
    },
    undefined,
    (error) => {
      console.error('Error loading robot GLB:', error);
      const spinner = document.getElementById('robotSpinner');
      if (spinner) {
         spinner.style.borderTopColor = 'red';
         spinner.style.width = 'auto';
         spinner.style.height = 'auto';
         spinner.style.borderRadius = '0';
         spinner.style.animation = 'none';
         spinner.style.color = 'red';
         spinner.innerText = "GLTF Load Error: " + (error.message || error);
      }
    }
  );

  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  const clock = new THREE.Clock();
  
  function getEase(t, start, end) {
    if (t <= start) return 0;
    if (t >= end) return 1;
    const p = (t - start) / (end - start);
    return 0.5 - 0.5 * Math.cos(p * Math.PI); 
  }

  // Exact mathematically calculated reach of the arm for a wider reach (X=1.0)
  const pickLoc = new THREE.Vector3(-1.0, 0.133, 0); 
  const dropLoc = new THREE.Vector3(1.0, 0.133, 0);  

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Ensure component is initialized at pickLoc
    if (component && component.parent === scene && pickLoc.y === 0.133 && !component.userData.started) {
        component.position.copy(pickLoc);
        component.userData.started = true;
    }

    const time = clock.getElapsedTime();

    if (robotSystem && component) {
      const cycleTime = 10; 
      const t = (time % cycleTime) / cycleTime; 

      // J1: Swivel base (Rotation around local Z axis)
      const j1Val = getEase(t, 0.05, 0.20) - getEase(t, 0.50, 0.65) * 2 + getEase(t, 0.85, 1.00);
      j1.rotation.z = -j1Val * (Math.PI / 2); // 90 degree sweep

      // Lowering actions
      const lowerPick = getEase(t, 0.15, 0.25) - getEase(t, 0.35, 0.45);
      const lowerDrop = getEase(t, 0.60, 0.70) - getEase(t, 0.80, 0.90);
      const lowerTotal = lowerPick + lowerDrop;

      // J2 & J3: Pitch arm for wider X=1.0 reach
      j2.rotation.y = lowerTotal * 1.18;
      j3.rotation.y = lowerTotal * 0.71;
      
      // J5: Counter-pitch so gripper grabs from the top
      j5.rotation.y = -lowerTotal * 1.60; 

      // J4: Wrist roll
      j4.rotation.x = lowerTotal * 0.2;

      // J6: Tool roll
      const grasp = getEase(t, 0.25, 0.30) - getEase(t, 0.75, 0.80);
      j6.rotation.x = grasp * (Math.PI / 2);

      // Pick and Place Logic
      if (t > 0.30 && t < 0.75) {
        if (component.parent !== gripperCenter) {
          gripperCenter.attach(component);
        }
      } else {
        if (component.parent === gripperCenter) {
          scene.attach(component);
          component.position.y = pickLoc.y; 
          component.rotation.set(0, 0, 0); // Keep upright
        }
        if (t > 0.95) {
          component.position.copy(pickLoc);
          component.rotation.set(0, 0, 0);
        }
      }
    }

    renderer.render(scene, camera);
  }

  animate();
});
