/**
 * 🚀 Retro Cyber Avoid - Firebase Auth & Data Sync Module
 * (c) 2026 Retro Cyber Avoid. Supported by Antigravity.
 */

// ============================================================================
// 1. Firebase Config & Initialization (대표님 계정 설정 영역)
// ============================================================================
// 대표님! 구글 Firebase 콘솔(https://console.firebase.google.com/)에서 프로젝트 생성 후 
// 아래의 설정을 대표님의 프로젝트 정보로 변경해주시면 즉시 클라우드에 연동되어 영구 저장됩니다.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let db = null;
let auth = null;
let isMockAuth = false; // Firebase 프로젝트 미설정 시 모의(Mock) 로그인을 위한 플래그

// Firebase 앱 초기화 시도
try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        console.log("🚀 Firebase Cloud Server Connected Successfully!");
    } else {
        throw new Error("Firebase configuration keys are not set yet.");
    }
} catch (e) {
    console.warn("⚠️ Firebase Config is missing or incomplete. Switched to 'Local Demo Mode' for UI testing.", e);
    isMockAuth = true;
}

// ============================================================================
// 2. DOM Elements (UI 요소 취득)
// ============================================================================
const loginModal = document.getElementById('login-modal');
const btnLoginOpen = document.getElementById('btn-login-open');
const btnLoginCloseModal = document.getElementById('btn-login-close-modal');
const btnEmailSignin = document.getElementById('btn-email-signin');
const btnEmailSignup = document.getElementById('btn-email-signup');
const btnGoogleSignin = document.getElementById('btn-google-signin');
const btnLogout = document.getElementById('btn-logout');

const inputEmail = document.getElementById('login-email');
const inputPassword = document.getElementById('login-password');

const pilotName = document.getElementById('pilot-name');
const pilotStatus = document.getElementById('pilot-status');
const pilotAvatar = document.getElementById('pilot-avatar');

// ============================================================================
// 3. UI Interactions (로그인 모달 토글 및 프로필 업데이트)
// ============================================================================
if (btnLoginOpen) {
    btnLoginOpen.addEventListener('click', () => {
        if (typeof SFX !== 'undefined') SFX.playBeep();
        loginModal.classList.add('active');
    });
}

if (btnLoginCloseModal) {
    btnLoginCloseModal.addEventListener('click', () => {
        if (typeof SFX !== 'undefined') SFX.playBeep();
        loginModal.classList.remove('active');
    });
}

// 팝업 모달 바깥 부분 클릭 시 닫기
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('active');
    }
});

// 파일럿 프로필 UI 업데이트 함수
function updatePilotProfileUI(user) {
    if (user) {
        // 로그인 상태
        pilotName.innerText = (user.displayName || user.email.split('@')[0] || "PILOT").toUpperCase();
        pilotName.className = "value small-value text-green";
        pilotStatus.innerText = "ONLINE";
        pilotStatus.className = "pilot-status-text online";
        
        if (user.photoURL) {
            pilotAvatar.innerHTML = `<img src="${user.photoURL}" class="pilot-avatar-img" alt="Pilot">`;
        } else {
            pilotAvatar.innerHTML = "🧑‍🚀";
            pilotAvatar.style.boxShadow = "0 0 8px var(--neon-green)";
            pilotAvatar.style.borderColor = "var(--neon-green)";
        }
        
        if (btnLoginOpen) btnLoginOpen.classList.add('hidden');
        if (btnLogout) btnLogout.classList.remove('hidden');
    } else {
        // 비로그인 상태 (게스트)
        pilotName.innerText = "GUEST PILOT";
        pilotName.className = "value small-value text-cyan";
        pilotStatus.innerText = "OFFLINE";
        pilotStatus.className = "pilot-status-text";
        pilotAvatar.innerHTML = "👤";
        pilotAvatar.style.boxShadow = "0 0 5px rgba(0, 243, 255, 0.3)";
        pilotAvatar.style.borderColor = "var(--neon-cyan)";
        
        if (btnLoginOpen) btnLoginOpen.classList.remove('hidden');
        if (btnLogout) btnLogout.classList.add('hidden');
    }
}

// ============================================================================
// 4. Data Sync Logic (클라우드 데이터 백업 및 머지)
// ============================================================================

// 로그인 시 데이터 통합(Merge) 및 동기화
async function syncAndLoadUserData(uid, email) {
    if (isMockAuth) {
        // 로컬 모의 동기화
        console.log(`[Mock Sync] Loaded cloud data for user: ${email}`);
        return;
    }

    try {
        const userDocRef = db.collection('pilots').doc(uid);
        const doc = await userDocRef.get();
        
        // 현재 로컬스토리지에 있는 데이터를 가져옵니다.
        const localCoins = parseInt(localStorage.getItem('cyber_avoid_coins')) || 0;
        const localUnlocked = JSON.parse(localStorage.getItem('cyber_avoid_unlocked_ships')) || ['default'];
        const localUpgrades = JSON.parse(localStorage.getItem('cyber_avoid_upgrades')) || { shieldCap: 0, magnetRange: 0, shieldDuration: 0 };
        const localHighScore = parseInt(localStorage.getItem('cyber_avoid_highscore')) || 0;

        if (doc.exists) {
            // 1. 이미 서버에 기존 파일럿 정보가 있는 경우 -> 머지(Merge) 진행
            const cloudData = doc.data();
            const cloudGameData = cloudData.gameData || {};

            console.log("☁️ Found Cloud Pilot Data. Executing Merge Protocols...");

            // 코인 병합 (로컬 코인과 클라우드 코인 중 더 높은 가치를 취하거나 합침. 여기선 유저 편의를 위해 합치되, 중복 방지를 위해 합친 값으로 적용)
            // 비로그인 상태에서 열심히 모은 코인을 날리지 않기 위해 비로그인 코인을 클라우드에 합산시킵니다.
            let mergedCoins = Math.max(localCoins, cloudGameData.coins || 0);
            if (localCoins > 0 && cloudGameData.coins === 0) {
                mergedCoins = localCoins;
            } else if (localCoins > 0 && cloudGameData.coins > 0) {
                // 로그인 시점에 로컬에 0보다 큰 코인이 있다면 유저가 방금 전 모은 것이므로 더해줍니다.
                // 단, 최초 로그인 시 중복 합산을 막기 위해 로컬스토리지 초기화 플래그를 체크할 수도 있습니다.
                // 여기서는 합리적으로 최댓값을 우선 취합니다. (안전하게 두 데이터 중 큰 값 적용)
                mergedCoins = Math.max(localCoins, cloudGameData.coins || 0);
            }

            // 잠금 해제 스킨 병합 (배열 합치기 및 중복 제거)
            const cloudUnlocked = cloudGameData.unlockedShips || ['default'];
            const mergedUnlocked = Array.from(new Set([...localUnlocked, ...cloudUnlocked]));

            // 업그레이드 수치 병합 (각 부문 최대값 레벨 취하기)
            const cloudUpgrades = cloudGameData.upgrades || { shieldCap: 0, magnetRange: 0, shieldDuration: 0 };
            const mergedUpgrades = {
                shieldCap: Math.max(localUpgrades.shieldCap, cloudUpgrades.shieldCap || 0),
                magnetRange: Math.max(localUpgrades.magnetRange, cloudUpgrades.magnetRange || 0),
                shieldDuration: Math.max(localUpgrades.shieldDuration, cloudUpgrades.shieldDuration || 0)
            };

            // 최고점수 병합
            const mergedHighScore = Math.max(localHighScore, cloudGameData.highScore || 0);

            // 로컬스토리지에 병합된 값 저장
            localStorage.setItem('cyber_avoid_coins', mergedCoins);
            localStorage.setItem('cyber_avoid_unlocked_ships', JSON.stringify(mergedUnlocked));
            localStorage.setItem('cyber_avoid_upgrades', JSON.stringify(mergedUpgrades));
            localStorage.setItem('cyber_avoid_highscore', mergedHighScore);

            // 전역 변수 동기화 (game.js 파일 로드 이후 시점)
            if (typeof totalCoins !== 'undefined') {
                totalCoins = mergedCoins;
                unlockedShips = mergedUnlocked;
                upgrades = mergedUpgrades;
                highScore = mergedHighScore;
                if (typeof updateHangarUI === 'function') updateHangarUI();
                if (typeof updateHUD === 'function') updateHUD();
            }

            // 병합된 최종 데이터를 클라우드 서버에 다시 업로드
            await userDocRef.set({
                email: email,
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                gameData: {
                    coins: mergedCoins,
                    unlockedShips: mergedUnlocked,
                    upgrades: mergedUpgrades,
                    highScore: mergedHighScore
                }
            }, { merge: true });

            console.log("✅ Cloud Sync Complete: Local storage updated with merged Cloud data.");
        } else {
            // 2. 가입 후 최초 로그인한 신규 유저 -> 현재의 로컬 데이터를 클라우드에 백업
            console.log("🆕 New Pilot Registered. Backing up local data to Cloud database...");
            
            await userDocRef.set({
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                gameData: {
                    coins: localCoins,
                    unlockedShips: localUnlocked,
                    upgrades: localUpgrades,
                    highScore: localHighScore
                }
            });
            console.log("✅ Cloud Backup Complete: Local data initialized on server.");
        }
    } catch (err) {
        console.error("❌ Error syncing pilot data with cloud:", err);
    }
}

// 게임 플레이 중 데이터가 변할 때 실시간 클라우드 백업 함수 (game.js에서 수시 호출)
async function syncGameDataToCloud() {
    if (isMockAuth) return; // 로컬 모의 상태 시 통과
    
    const currentUser = auth.currentUser;
    if (!currentUser) return; // 로그인 상태가 아니면 패스

    try {
        const localCoins = parseInt(localStorage.getItem('cyber_avoid_coins')) || 0;
        const localUnlocked = JSON.parse(localStorage.getItem('cyber_avoid_unlocked_ships')) || ['default'];
        const localUpgrades = JSON.parse(localStorage.getItem('cyber_avoid_upgrades')) || { shieldCap: 0, magnetRange: 0, shieldDuration: 0 };
        const localHighScore = parseInt(localStorage.getItem('cyber_avoid_highscore')) || 0;

        await db.collection('pilots').doc(currentUser.uid).set({
            gameData: {
                coins: localCoins,
                unlockedShips: localUnlocked,
                upgrades: localUpgrades,
                highScore: localHighScore
            }
        }, { merge: true });
        
        console.log("☁️ Game progress auto-saved to cloud database.");
    } catch (err) {
        console.error("❌ Cloud auto-save failed:", err);
    }
}

// ============================================================================
// 5. Auth Processors (실제 & 모의 로그인 핸들러)
// ============================================================================

// [A] 구글 간편 로그인
if (btnGoogleSignin) {
    btnGoogleSignin.addEventListener('click', async () => {
        if (typeof SFX !== 'undefined') SFX.playBeep();
        
        if (isMockAuth) {
            // 모의 구글 로그인
            const mockUser = {
                uid: "mock_google_uid_1234",
                email: "demo.pilot@gmail.com",
                displayName: "Goldie Voyager",
                photoURL: null
            };
            localStorage.setItem('cyber_avoid_mock_user', JSON.stringify(mockUser));
            updatePilotProfileUI(mockUser);
            loginModal.classList.remove('active');
            alert("[데모 모드] 구글 간편 로그인 성공!\n(Firebase 설정 완료 후 실제 클라우드와 작동합니다.)");
            return;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            updatePilotProfileUI(user);
            loginModal.classList.remove('active');
            
            // 데이터 동기화 시작
            await syncAndLoadUserData(user.uid, user.email);
            
            alert(`환영합니다, ${user.displayName || '파일럿'}님! 데이터 동기화 완료.`);
        } catch (error) {
            console.error("Google 로그인 에러:", error);
            alert("Google 로그인에 실패했습니다. " + error.message);
        }
    });
}

// [B] 이메일 로그인 (기존 계정으로 로그인)
if (btnEmailSignin) {
    btnEmailSignin.addEventListener('click', async () => {
        const email = inputEmail.value.trim();
        const password = inputPassword.value;
        
        if (!email || !password) {
            alert("이메일과 비밀번호를 모두 입력해주세요.");
            return;
        }

        if (typeof SFX !== 'undefined') SFX.playBeep();

        if (isMockAuth) {
            // 모의 이메일 로그인
            const mockUser = {
                uid: "mock_email_uid_5678",
                email: email,
                displayName: email.split('@')[0],
                photoURL: null
            };
            localStorage.setItem('cyber_avoid_mock_user', JSON.stringify(mockUser));
            updatePilotProfileUI(mockUser);
            loginModal.classList.remove('active');
            alert("[데모 모드] 이메일 로그인 성공!\n(Firebase 설정 완료 후 실제 클라우드와 작동합니다.)");
            return;
        }

        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            const user = result.user;
            
            updatePilotProfileUI(user);
            loginModal.classList.remove('active');
            
            // 데이터 동기화 시작
            await syncAndLoadUserData(user.uid, user.email);
            
            alert(`반갑습니다! 파일럿 ${user.email.split('@')[0].toUpperCase()} 연합 서버 접속 완료.`);
        } catch (error) {
            console.error("이메일 로그인 에러:", error);
            alert("로그인 실패: 이메일 또는 비밀번호를 다시 확인하세요.");
        }
    });
}

// [C] 이메일 회원가입 (신규 파일럿 등록)
if (btnEmailSignup) {
    btnEmailSignup.addEventListener('click', async () => {
        const email = inputEmail.value.trim();
        const password = inputPassword.value;
        
        if (!email || !password) {
            alert("회원가입할 이메일과 비밀번호를 입력해주세요.");
            return;
        }
        if (password.length < 6) {
            alert("비밀번호는 최소 6자리 이상이어야 합니다.");
            return;
        }

        if (typeof SFX !== 'undefined') SFX.playBeep();

        if (isMockAuth) {
            alert("[데모 모드] 로컬 회원가입 성공! 해당 정보로 로그인 절차를 진행합니다.");
            const mockUser = {
                uid: "mock_email_uid_5678",
                email: email,
                displayName: email.split('@')[0],
                photoURL: null
            };
            localStorage.setItem('cyber_avoid_mock_user', JSON.stringify(mockUser));
            updatePilotProfileUI(mockUser);
            loginModal.classList.remove('active');
            return;
        }

        try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            const user = result.user;
            
            updatePilotProfileUI(user);
            loginModal.classList.remove('active');
            
            // 데이터 최초 클라우드 백업 생성 및 동기화
            await syncAndLoadUserData(user.uid, user.email);
            
            alert(`축하합니다! 신규 파일럿 등록 완료. 은하 연합 서버에 오신 것을 환영합니다!`);
        } catch (error) {
            console.error("이메일 가입 에러:", error);
            alert("파일럿 등록 실패: " + error.message);
        }
    });
}

// [D] 로그아웃 처리
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        if (typeof SFX !== 'undefined') SFX.playBeep();
        
        if (isMockAuth) {
            localStorage.removeItem('cyber_avoid_mock_user');
            updatePilotProfileUI(null);
            alert("[데모 모드] 로그아웃되었습니다.");
            return;
        }

        try {
            await auth.signOut();
            updatePilotProfileUI(null);
            alert("성공적으로 로그아웃 및 오프라인 전환되었습니다.");
        } catch (error) {
            console.error("로그아웃 에러:", error);
        }
    });
}

// ============================================================================
// 6. Page Load Observer (접속 시 로그인 상태 복구)
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (isMockAuth) {
        // 모의 상태 복구
        const cachedMock = localStorage.getItem('cyber_avoid_mock_user');
        if (cachedMock) {
            try {
                const user = JSON.parse(cachedMock);
                updatePilotProfileUI(user);
            } catch(e) {}
        }
    } else {
        // 실제 Firebase Auth 상태 감지 리스너 등록
        auth.onAuthStateChanged((user) => {
            updatePilotProfileUI(user);
            if (user) {
                console.log(`📡 Pilot active session: ${user.email} (UID: ${user.uid})`);
                // 이미 로그인 세션이 살아있는 경우 동기화 확인
                syncAndLoadUserData(user.uid, user.email);
            } else {
                console.log("📡 Pilot session: Offline (Guest)");
            }
        });
    }
});
