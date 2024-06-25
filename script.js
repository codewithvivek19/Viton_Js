let video;
let poseNet;
let poses = [];

async function setupCamera() {
    video = document.getElementById('video');
    video.width = window.innerWidth;
    video.height = window.innerHeight;

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadPoseNet() {
    poseNet = await posenet.load();
    video.play();
    detectPoses();
}

function detectPoses() {
    poseNet.on('pose', (results) => {
        poses = results;
        draw();
    });

    poseNet.estimatePoses(video, {
        flipHorizontal: true,
        decodingMethod: 'single-person'
    }).then((results) => {
        poses = results;
        requestAnimationFrame(detectPoses);
    });
}

function draw() {
    const canvas = document.getElementById('output');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (poses.length > 0) {
        const pose = poses[0].pose;

        const leftShoulder = pose.keypoints.find(p => p.part === 'leftShoulder');
        const rightShoulder = pose.keypoints.find(p => p.part === 'rightShoulder');

        if (leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
            const img = new Image();
            img.src = 'shirt.png';
            img.onload = () => {
                const width = Math.abs(rightShoulder.position.x - leftShoulder.position.x) * 2;
                const height = width * (img.height / img.width);
                const x = (leftShoulder.position.x + rightShoulder.position.x) / 2 - width / 2;
                const y = (leftShoulder.position.y + rightShoulder.position.y) / 2 - height / 2;

                ctx.drawImage(img, x, y, width, height);
            };
        }
    }

    ctx.restore();
}

async function main() {
    try {
        await setupCamera();
        await loadPoseNet();
    } catch (error) {
        console.error("Error initializing the application:", error);
    }
}

main();
