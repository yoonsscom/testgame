// 게임 요소들
const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const gameOver = document.getElementById('gameOver');
const scoreElement = document.getElementById('score');
const realtimeScoreElement = document.getElementById('realtimeScore');

// 게임 변수들
let playerPosition = 150; // 플레이어의 x 좌표
let gameRunning = true;
let poops = []; // 똥들을 저장할 배열
let score = 0; // 피한 똥 개수

// 충돌 감지용 변수들
let playerMaskImage = null;
let playerMaskLoaded = false;

// 키 입력 상태
let keys = {
    left: false,
    right: false
};

// 키 입력 감지
document.addEventListener('keydown', (e) => {
    if (!gameRunning) {
        if (e.code === 'Space') {
            restartGame();
        }
        return;
    }

    if (e.code === 'ArrowLeft') {
        keys.left = true;
    } else if (e.code === 'ArrowRight') {
        keys.right = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') {
        keys.left = false;
    } else if (e.code === 'ArrowRight') {
        keys.right = false;
    }
});

// 플레이어 움직임 함수
function movePlayer() {
    if (!gameRunning) return;
    
    if (keys.left && playerPosition > 0) {
        playerPosition -= 20;
    }
    if (keys.right && playerPosition < 300) {
        playerPosition += 20;
    }
    
    player.style.left = playerPosition + 'px';
}

// 똥 생성 함수
function createPoop() {
    if (!gameRunning) return;
    
    const poop = document.createElement('div');
    poop.className = 'poop';
    poop.style.left = Math.random() * 370 + 'px'; // 0~370px 사이의 랜덤 위치
    poop.style.top = '0px';
    
    gameArea.appendChild(poop);
    poops.push(poop);
}

// 똥 떨어뜨리기
function movePoops() {
    if (!gameRunning) return;
    
    poops.forEach((poop, index) => {
        const currentTop = parseInt(poop.style.top);
        poop.style.top = (currentTop + 8) + 'px'; // 3px씩 아래로 이동
        
        // 똥이 화면 밖으로 나가면 제거하고 점수 증가
        if (currentTop > 600) {
            poop.remove();
            poops.splice(index, 1);
            score++; // 똥을 피했으므로 점수 증가
            realtimeScoreElement.textContent = score; // 실시간 점수 업데이트
        }
        
        // 충돌 감지
        if (checkCollision(poop)) {
            gameOverFunc();
        }
    });
}

// 마스크 이미지 로드
function loadPlayerMask() {
    playerMaskImage = new Image();
    playerMaskImage.onload = function() {
        playerMaskLoaded = true;
        console.log('플레이어 마스크 이미지 로드 완료');
    };
    playerMaskImage.src = 'images/character_mask.png';
}

// 픽셀 기반 충돌 감지 함수
function checkCollision(poop) {
    if (!playerMaskLoaded) {
        // 마스크가 로드되지 않았으면 기본 사각형 충돌 감지
        const playerRect = player.getBoundingClientRect();
        const poopRect = poop.getBoundingClientRect();
        return !(playerRect.right < poopRect.left || 
                 playerRect.left > poopRect.right || 
                 playerRect.bottom < poopRect.top || 
                 playerRect.top > poopRect.bottom);
    }

    const playerRect = player.getBoundingClientRect();
    const poopRect = poop.getBoundingClientRect();
    
    // 기본 사각형 충돌 체크 (성능 최적화)
    if (playerRect.right < poopRect.left || 
        playerRect.left > poopRect.right || 
        playerRect.bottom < poopRect.top || 
        playerRect.top > poopRect.bottom) {
        return false;
    }

    // 픽셀 단위 충돌 감지
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 100;
    canvas.height = 100;

    // 마스크 이미지 그리기
    ctx.drawImage(playerMaskImage, 0, 0, 100, 100);
    const imageData = ctx.getImageData(0, 0, 100, 100);
    const pixels = imageData.data;

    // 똥의 상대적 위치 계산
    const relativeX = Math.floor(poopRect.left - playerRect.left);
    const relativeY = Math.floor(poopRect.top - playerRect.top);

    // 똥 크기만큼 체크 (15px)
    for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
            const checkX = relativeX + x;
            const checkY = relativeY + y;
            
            if (checkX >= 0 && checkX < 100 && checkY >= 0 && checkY < 100) {
                const pixelIndex = (checkY * 100 + checkX) * 4;
                const red = pixels[pixelIndex];     // R 채널
                const green = pixels[pixelIndex + 1]; // G 채널
                const blue = pixels[pixelIndex + 2];  // B 채널
                const alpha = pixels[pixelIndex + 3]; // 알파 채널
                
                // 검은색이고 불투명한 픽셀이면 충돌
                if (alpha > 128 && red < 128 && green < 128 && blue < 128) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// 게임 오버 함수
function gameOverFunc() {
    gameRunning = false;
    gameOver.style.display = 'block';
    scoreElement.textContent = score; // 점수 표시
    
    // 모든 똥 제거
    poops.forEach(poop => poop.remove());
    poops = [];
}

// 게임 재시작 함수
function restartGame() {
    gameRunning = true;
    gameOver.style.display = 'none';
    playerPosition = 150;
    player.style.left = playerPosition + 'px';
    poops = [];
    score = 0; // 점수 초기화
    realtimeScoreElement.textContent = score; // 실시간 점수 초기화
}

// 게임 루프
setInterval(() => {
    if (gameRunning) {
        movePlayer(); // 플레이어 움직임
        movePoops();  // 똥 움직임
    }
}, 45); // 45ms마다 실행

// 똥 생성 (1초마다)
setInterval(() => {
    if (gameRunning) {
        createPoop();
    }
}, 400);

// 게임 시작 시 마스크 이미지 로드
loadPlayerMask();
