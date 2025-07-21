// Elite Fashions Chat Application - Enhanced Version
class EliteFashionsChat {
    constructor() {
        this.currentUser = null;
        this.selectedUserId = null;
        this.db = null;
        this.unsubscribers = [];
        this.isAdmin = false;
        this.chatUnsubscriber = null;
        this.users = new Map();
        this.typingTimeout = null;
        this.lastActivity = Date.now();
        this.activityCheckInterval = null;
        
        this.initializeApp();
    }

   async initializeApp() {
    this.firstMessageFromURL = new URLSearchParams(window.location.search).get("message"); //  RIGHT HERE

    try {
        this.showLoading(true);

        // Import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js');
        const { 
            getFirestore, 
            collection, 
            addDoc, 
            query, 
            orderBy, 
            onSnapshot, 
            doc, 
            setDoc, 
            getDoc, 
            getDocs, 
            serverTimestamp, 
            where, 
            updateDoc,
            deleteDoc,
            limit
        } = await import('https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js');

        // Initialize Firebase with user's config
        this.app = initializeApp(window.firebaseConfig);
        this.db = getFirestore(this.app);

        // Store Firebase functions
        this.firebase = {
            collection,
            addDoc,
            query,
            orderBy,
            onSnapshot,
            doc,
            setDoc,
            getDoc,
            getDocs,
            serverTimestamp,
            where,
            updateDoc,
            deleteDoc,
            limit
        };

        // Initialize EmailJS
           // Initialize EmailJS
    emailjs.init("JD7gpgG5MKkF-D40p");
    
        this.initializeEventListeners();
        this.initializeTheme();
        this.requestNotificationPermission();
        this.startActivityTracking();
        this.showLoading(false);

    } catch (error) {
        console.error('Error initializing app:', error);
        this.showError('Failed to initialize application. Please refresh the page.');
        this.showLoading(false);
    }

    window.chatApp = this;
    this.populateEmojis();

}


    initializeEventListeners() {
        // Authentication form events
        const authForm = document.getElementById('authForm');
        const toggleAuth = document.getElementById('toggleAuth');
        const authSubmit = document.getElementById('authSubmit');
        const nameGroup = document.getElementById('nameGroup');

        let isSignUp = false;

        authForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (isSignUp) {
                this.handleSignUp();
            } else {
                this.handleLogin();
            }
        });

        toggleAuth?.addEventListener('click', () => {
            isSignUp = !isSignUp;
            this.clearMessages();
            
            if (isSignUp) {
                authSubmit.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
                toggleAuth.innerHTML = '<i class="fas fa-sign-in-alt"></i> Already have an account? Sign In';
                nameGroup.style.display = 'block';
            } else {
                authSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                toggleAuth.innerHTML = '<i class="fas fa-user-plus"></i> Need an account? Sign Up';
                nameGroup.style.display = 'none';
            }
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // User menu
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenuDropdown = document.getElementById('userMenuDropdown');

        userMenuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenuDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            userMenuDropdown?.classList.remove('show');
        });

        // Menu toggle for mobile
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Admin panel toggle
        document.getElementById('toggleAdminPanel')?.addEventListener('click', () => {
            this.toggleAdminPanel();
        });

        // Logout with confirmation
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.showLogoutConfirmation();
        });

        // Logout confirmation modal
        document.getElementById('confirmLogout')?.addEventListener('click', () => {
            this.signOut();
        });

        document.getElementById('cancelLogout')?.addEventListener('click', () => {
            this.hideLogoutConfirmation();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.signOut();
        });


        document.getElementById('closeLogoutModal')?.addEventListener('click', () => {
            this.hideLogoutConfirmation();
        });

        // Close admin panel
        document.getElementById('closeAdminBtn')?.addEventListener('click', () => {
            this.closeAdminPanel();
        });

        // Refresh users
        document.getElementById('refreshUsers')?.addEventListener('click', () => {
            this.refreshUserList();
        });

        //feadback
        document.getElementById('requestFeedbackBtn')?.addEventListener('click', () => {
            if (this.selectedUserId && this.isAdmin) {
              this.sendFeedbackRequestTo(this.selectedUserId);
            }
        });

        // Message form
        const messageForm = document.getElementById('messageForm');
        const messageInput = document.getElementById('messageInput');

        messageForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Message input enhancements
        messageInput?.addEventListener('input', (e) => {
            this.updateCharacterCount();
            this.handleTyping();
        });

        messageInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Close chat
        document.getElementById('closeChatBtn')?.addEventListener('click', () => {
            this.closeChat();
        });

        // Back to welcome (mobile)
        document.getElementById('backToWelcome')?.addEventListener('click', () => {
            this.closeChat();
        });

        // Clear chat
        document.getElementById('clearChatBtn')?.addEventListener('click', () => {
            this.clearChatHistory();
        });

        // Email user button
        document.getElementById('emailUserBtn')?.addEventListener('click', () => {
            this.openEmailModal();
        });

        // Email modal
        document.getElementById('closeEmailModal')?.addEventListener('click', () => {
            this.closeEmailModal();
        });

        document.getElementById('cancelEmail')?.addEventListener('click', () => {
            this.closeEmailModal();
        });

        document.getElementById('emailForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendEmail();
        });

        // Emoji picker
        document.getElementById('emojiBtn')?.addEventListener('click', () => {
            this.toggleEmojiPicker();
        });

        // img apload
        document.getElementById("attachBtn")?.addEventListener("click", () => {
         document.getElementById("imageUploadInput").click();
        });

        document.getElementById("imageUploadInput")?.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const container = document.getElementById("messagesContainer");
         const statusEl = document.createElement("div");
          statusEl.textContent = `⏳ Uploading ${file.name}...`;
          statusEl.style.color = "#d97706";
          container.appendChild(statusEl);
          chatApp.scrollToBottom?.();

          const cloudNames = ["de7bwqvq5"];
          const selectedCloud = cloudNames[Math.floor(Math.random() * cloudNames.length)];

          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "myupload");

          try {
              const res = await fetch(`https://api.cloudinary.com/v1_1/${selectedCloud}/image/upload`, {
                  method: "POST",
                  body: formData
              });

              if (!res.ok) throw new Error("Upload failed");
              const data = await res.json();
              const imageUrl = data.secure_url;

              statusEl.remove();
              document.getElementById("messageInput").value = imageUrl;
              chatApp.sendMessage?.(); // auto send

          } catch (err) {
              console.error("Upload failed:", err);
              statusEl.textContent = `❌ Failed to upload image`;
              statusEl.style.color = "#dc2626";
          }
        });



        // User search
        const userSearch = document.getElementById('userSearch');
        const clearSearch = document.getElementById('clearSearch');

        userSearch?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
            this.toggleClearSearch(e.target.value);
        });

        clearSearch?.addEventListener('click', () => {
            userSearch.value = '';
            this.filterUsers('');
            this.toggleClearSearch('');
        });

        // Activity tracking
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            });
        });

        // Window focus/blur for presence
        window.addEventListener('focus', () => {
            this.updateUserPresence('online');
        });

        window.addEventListener('blur', () => {
            this.updateUserPresence('away');
        });

        // Before unload
        window.addEventListener('beforeunload', () => {
            this.updateUserPresence('offline');
        });


        // Voice recording

        const recordBtn = document.getElementById('recordAudioBtn');
        let mediaRecorder;
        let audioChunks = [];

        recordBtn?.addEventListener('click', async () => {
         if (mediaRecorder && mediaRecorder.state === 'recording') {
         // Stop recording
          mediaRecorder.stop();
         recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        return;
         }

        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];
         mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) audioChunks.push(event.data);
         };

         mediaRecorder.onstop = async () => {
           const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

          const container = document.getElementById('messagesContainer');
          const statusEl = document.createElement('div');
          statusEl.textContent = `⏳ Uploading audio...`;
          statusEl.style.color = "#d97706";
          container.appendChild(statusEl);
          chatApp.scrollToBottom?.();

          const formData = new FormData();
          formData.append('file', audioBlob);
              formData.append('upload_preset', 'myupload');

          const cloudNames = ["de7bwqvq5", "drooohxav", "ddbphbdqs"];
          const selectedCloud = cloudNames[Math.floor(Math.random() * cloudNames.length)];

          try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${selectedCloud}/auto/upload`, {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            const audioUrl = data.secure_url;

      statusEl.remove();
      document.getElementById('messageInput').value = audioUrl;
      chatApp.sendMessage?.();

          } catch (err) {
                console.error("Audio upload failed:", err);
            statusEl.textContent = `❌ Failed to upload audio`;
                  statusEl.style.color = "#dc2626";
           }
         };

         mediaRecorder.start();
         recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
        });

    }


 async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!email || !password) {
            this.showError('Please enter both email and password.');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return;
        }

        try {
            this.showLoading(true);

            // Check for admin login
            if (email === "Abcd1234567@gmail.com" && password === "Abcd1234567") {
                this.currentUser = { 
                    uid: 'admin', 
                    email: email, 
                    displayName: 'Admin',
                    role: 'admin'
                };
                this.isAdmin = true;
                this.showChatPanel();
                this.loadAdminUsers();
                this.showToast('Welcome Admin!', 'success');
                return;
            }

            // Check regular user login
            const q = this.firebase.query(
                this.firebase.collection(this.db, 'users_data'),
                this.firebase.where('username', '==', email),
                this.firebase.where('password', '==', password)
            );
            
            const snapshot = await this.firebase.getDocs(q);
            
            if (snapshot.empty) {
                this.showError('Invalid username or password. Please sign up if you\'re new.');
                return;
            }

            const userData = snapshot.docs[0].data();
            this.currentUser = { 
                uid: snapshot.docs[0].id, 
                email: email, 
                displayName: userData.displayName || email.split('@')[0],
                role: 'user'
            };
            this.isAdmin = false;
            this.showChatPanel();
            this.loadUserChat(this.currentUser.uid);
            this.showToast(`Welcome back, ${this.currentUser.displayName}!`, 'success');
            
            
            // Auto-send first message from URL if it exists
if (this.firstMessageFromURL && !localStorage.getItem("messageSentOnce")) {
    setTimeout(() => {
        const decoded = decodeURIComponent(this.firstMessageFromURL);
        document.getElementById("messageInput").value = decoded;
        this.sendMessage();
        localStorage.setItem("messageSentOnce", "true");
    }, 1000);
}

        } catch (error) {
            console.error('Error during login:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async handleSignUp() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const displayName = document.getElementById('displayName').value.trim();
        
        if (!email || !password) {
            this.showError('Please enter both email and password.');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long.');
            return;
        }

        try {
            this.showLoading(true);

            // Check if user already exists
            const q = this.firebase.query(
                this.firebase.collection(this.db, 'users_data'),
                this.firebase.where('username', '==', email)
            );
            
            const snapshot = await this.firebase.getDocs(q);
            
            if (!snapshot.empty) {
                this.showError('Email already registered. Please sign in instead.');
                return;
            }

            // Create new user
            await this.firebase.addDoc(this.firebase.collection(this.db, 'users_data'), {
                username: email,
                displayName: displayName || email.split('@')[0],
                password: password,
                role: 'you',
                createdAt: this.firebase.serverTimestamp(),
                lastSeen: this.firebase.serverTimestamp(),
                status: 'offline'
            });

            this.showSuccess('Account created successfully! You can now sign in.');
            
            // Clear form and switch to login
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('displayName').value = '';
            document.getElementById('toggleAuth').click();

        } catch (error) {
            console.error('Error during signup:', error);
            this.showError('Signup failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    showChatPanel() {
        document.getElementById('authPanel').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        this.updateUserInfo();
        this.updateUserPresence('online');
        
        // Show admin contact for regular users
        if (!this.isAdmin) {
            const adminContact = document.getElementById('adminContact');
            adminContact.style.display = 'flex';
            adminContact.addEventListener('click', () => {
                this.startChatWithAdmin();
            });
            
            // Update welcome message for users
            const welcomeMessage = document.getElementById('welcomeMessage');
            if (welcomeMessage) {
                welcomeMessage.textContent = 'Click on Admin Support to start chatting';
            }
        } else {
            // Update welcome message for admin
            const welcomeMessage = document.getElementById('welcomeMessage');
            if (welcomeMessage) {
                welcomeMessage.textContent = 'Select a user to start chatting';
            }
        }

        // 🔔 NEW: Show address modal if not filled
    this.checkUserAddress();

    }

    signOut() {
        this.updateUserPresence('offline');
        this.cleanupSubscriptions();
        this.hideLogoutConfirmation();
        setTimeout(() => {
            location.reload();
        }, 500);
    }

    showLogoutConfirmation() {
        const modal = document.getElementById('logoutModal');
        if (modal) modal.style.display = 'flex';
    }

    hideLogoutConfirmation() {
        const modal = document.getElementById('logoutModal');
        if (modal) modal.style.display = 'none';
    }


    isValidEmail(email) {
        return /^\S+@\S+\.\S+$/.test(email);
    }

    updateUserInfo() {
        const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        const initials = this.generateInitials(displayName);
        
        // Update current user name displays
        const currentUserName = document.getElementById('currentUserName');
        const headerUserName = document.getElementById('headerUserName');
        
        if (currentUserName) currentUserName.textContent = displayName;
        if (headerUserName) headerUserName.textContent = displayName;
        
        // Update avatars
        const headerAvatar = document.getElementById('headerAvatar');
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        
        if (headerAvatar) headerAvatar.textContent = initials;
        if (sidebarAvatar) sidebarAvatar.textContent = initials;

        // Show/hide admin panel toggle
        const adminPanelToggle = document.getElementById('toggleAdminPanel');
        if (adminPanelToggle) {
            adminPanelToggle.style.display = this.isAdmin ? 'flex' : 'none';
        }
    }

    generateInitials(name) {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    async loadAdminUsers() {
        try {
            this.showLoading(true, 'Loading users...');

            const usersQuery = this.firebase.query(
                this.firebase.collection(this.db, 'users_data'),
                this.firebase.where('role', '==', 'you')
            );

            const unsubscribe = this.firebase.onSnapshot(usersQuery, (snapshot) => {
                this.renderAdminUsers(snapshot);
                this.updateStats(snapshot.size);
            });

            this.unsubscribers.push(unsubscribe);

        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users.');
        } finally {
            this.showLoading(false);
        }
    }

//------------------------address------------------------
    async checkUserAddress() {
    const docRef = this.firebase.doc(this.db, "user_addresses", this.currentUser.uid);
    const docSnap = await this.firebase.getDoc(docRef);

    if (!docSnap.exists()) {
        document.getElementById('addressModal').style.display = 'flex';

        const form = document.getElementById('addressForm');
        form.onsubmit = async (e) => {
            e.preventDefault();

            const data = {
                fullName: document.getElementById('fullName').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value,
                createdAt: this.firebase.serverTimestamp()
            };

            try {
                await this.firebase.setDoc(docRef, data);
                document.getElementById('addressModal').style.display = 'none';
                this.showToast("Address saved successfully!", "success");
            } catch (err) {
                console.error("Error saving address:", err);
                this.showToast("Failed to save address", "error");
            }
        };
    }
}


    async loadUserChat(userId) {
        try {
            // Show chat interface for regular user
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('chatInterface').style.display = 'flex';
            
            // Update chat header to show admin
            document.getElementById('chatUserName').textContent = 'Admin Support';
            document.getElementById('chatUserAvatar').innerHTML = '<i class="fas fa-shield-alt"></i>';
            
            // Show loading in messages
            this.showMessagesLoading(true);
            
            const chatRef = this.firebase.collection(this.db, 'chat_messages', userId, 'chat');
            const q = this.firebase.query(chatRef, this.firebase.orderBy('timestamp'));
            
            if (this.chatUnsubscriber) {
                this.chatUnsubscriber();
            }
            
            this.chatUnsubscriber = this.firebase.onSnapshot(q, (snapshot) => {
                this.renderUserMessages(snapshot);
                this.showMessagesLoading(false);
            });

            this.unsubscribers.push(this.chatUnsubscriber);
            this.selectedUserId = 'admin';

        } catch (error) {
            console.error('Error loading chat:', error);
            this.showError('Failed to load chat messages.');
            this.showMessagesLoading(false);
        }
    }

    async renderAdminUsers(snapshot) {
        
        const userList = document.getElementById('userList');
         if (!userList) return;

         const adminContact = document.getElementById('adminContact');
         userList.innerHTML = '';
        if (adminContact) {
          userList.appendChild(adminContact);
        }

        const userCount = document.getElementById('userCount');
        if (userCount) {
            userCount.textContent = snapshot.size;
         }

        const sectionTitle = document.getElementById('sectionTitle');
        if (sectionTitle) {
          sectionTitle.textContent = this.isAdmin ? 'Users' : 'Contacts';
        }

        const unreadUsers = [];
        const readUsers = [];

        // Wait for all user checks to complete
        await Promise.all(snapshot.docs.map(async (userDoc) => {
          const userId = userDoc.id;
          const user = userDoc.data();

          const userDiv = document.createElement('div');
          userDiv.className = 'user-item';
          userDiv.dataset.userId = userId;

          const initials = this.generateInitials(user.displayName || user.username);
          const displayName = user.displayName || user.username.split('@')[0];

          userDiv.innerHTML = `
            <div class="avatar" style="position: relative;">
                ${initials}
                    <span class="unread-dot" id="unread-${userId}" style="display: none;"></span>
            </div>
            <div class="user-details">
                <h4>${displayName}</h4>
                <p>Click to start chat</p>
            </div>
            <button class="action-btn" title="View Address" onclick="chatApp.viewUserAddress('${userId}')">
                 <i class="fas fa-map-marker-alt"></i>
            </button>
            <div class="online-indicator"></div>
          `;

          userDiv.addEventListener('click', () => {
            this.startChatWithUser(userId, displayName, user.username);
          });

          this.users.set(userId, user);

          // Check for unread messages
          const chatRef = this.firebase.collection(this.db, 'chat_messages', userId, 'chat');
          const qUnread = this.firebase.query(chatRef, this.firebase.where('read', '==', false), this.firebase.limit(1));
          const snapshotUnread = await this.firebase.getDocs(qUnread);
          const dot = userDiv.querySelector(`#unread-${userId}`);

          if (!snapshotUnread.empty) {
            if (dot) dot.style.display = 'block';
            unreadUsers.push(userDiv);
          } else {
            readUsers.push(userDiv);
          }
        }));

        // Append unread first, then read users
         [...unreadUsers, ...readUsers].forEach(userDiv => userList.appendChild(userDiv));

         // Update admin user list (optional)
         this.updateAdminUserList(snapshot);
    }       



     async viewUserAddress(userId) {
     try {
    const docRef = this.firebase.doc(this.db, "user_addresses", userId);
    const docSnap = await this.firebase.getDoc(docRef);
    
    if (!docSnap.exists()) {
      alert("❌ No address found for this user.");
      return;
    }

    const data = docSnap.data();

             const addressText = `
             ${data.fullName}
             📞 ${data.phone}
             🏠 ${data.address}
             🏙️ ${data.city}, ${data.state} - ${data.zipCode}
             `.trim();

              await navigator.clipboard.writeText(addressText);

              alert(`📍 Address Info:\n\n${addressText}\n\n(Copied to clipboard ✅)`);

        } catch (err) {
            console.error("Error fetching address:", err);
             alert("⚠️ Error retrieving address.");
         }

    }




    updateAdminUserList(snapshot) {
        const adminUserList = document.getElementById('adminUserList');
        if (!adminUserList || !this.isAdmin) return;

        adminUserList.innerHTML = '';
        
        snapshot.forEach((userDoc) => {
            const userId = userDoc.id;
            const user = userDoc.data();
            
            const userDiv = document.createElement('div');
            userDiv.className = 'admin-user-item';
            userDiv.dataset.userId = userId;
            
            const initials = this.generateInitials(user.displayName || user.username);
            const displayName = user.displayName || user.username.split('@')[0];
            
            userDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="avatar" style="width: 35px; height: 35px; font-size: 0.9rem;">${initials}</div>
                    <div>
                        <h4 style="margin: 0; font-size: 0.9rem;">${displayName}</h4>
                        <p style="margin: 0; font-size: 0.75rem; opacity: 0.7;">${user.username}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn email-btn" onclick="chatApp.openEmailModalForUser('${userId}', '${user.username}', '${displayName}')" title="Send Email">
                        <i class="fas fa-envelope"></i>
                    </button>
                    <button class="action-btn" onclick="chatApp.startChatWithUser('${userId}', '${displayName}', '${user.username}')" title="Start Chat">
                        <i class="fas fa-comments"></i>
                    </button>
                </div>
            `;
            
            adminUserList.appendChild(userDiv);
        });
    }

    startChatWithAdmin() {
        if (!this.currentUser) return;
        
        this.selectedUserId = 'admin';
        this.loadUserChat(this.currentUser.uid);
        
        // Update active state
        const adminContact = document.getElementById('adminContact');
        if (adminContact) {
            // Remove active from all users
            document.querySelectorAll('.user-item').forEach(item => {
                item.classList.remove('active');
            });
            adminContact.classList.add('active');
        }
        
        // Hide sidebar on mobile
        if (window.innerWidth <= 768) {
            this.hideSidebar();
        }
    }

    async startChatWithUser(userId, displayName, email) {
        if (!this.isAdmin) return;
        
        this.selectedUserId = userId;
        
        try {
            // Show chat interface
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('chatInterface').style.display = 'flex';
            
            // Update chat header
            const initials = this.generateInitials(displayName);
            document.getElementById('chatUserName').textContent = displayName;
            document.getElementById('chatUserAvatar').textContent = initials;
            
            // Show loading
            this.showMessagesLoading(true);
            
            // Load chat messages
            const chatRef = this.firebase.collection(this.db, 'chat_messages', userId, 'chat');
            const q = this.firebase.query(chatRef, this.firebase.orderBy('timestamp'));
            
            // Unsubscribe from previous chat
            if (this.chatUnsubscriber) {
                this.chatUnsubscriber();
            }
            
            this.chatUnsubscriber = this.firebase.onSnapshot(q, (snapshot) => {
                this.renderAdminMessages(snapshot);
                this.showMessagesLoading(false);
            });

            this.markMessagesAsRead(userId);
            
            // Update active state
            document.querySelectorAll('.user-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const userItem = document.querySelector(`[data-user-id="${userId}"]`);
            if (userItem) {
                userItem.classList.add('active');
            }
            
            // Update admin panel active state
            document.querySelectorAll('.admin-user-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const adminUserItem = document.querySelector(`.admin-user-item[data-user-id="${userId}"]`);
            if (adminUserItem) {
                adminUserItem.classList.add('active');
            }
            
            // Hide sidebar on mobile
            if (window.innerWidth <= 768) {
                this.hideSidebar();
            }
            
        } catch (error) {
            console.error('Error starting chat:', error);
            this.showError('Failed to start chat.');
            this.showMessagesLoading(false);
        }
    }


    async markMessagesAsRead(userId) {
     try {
        const chatRef = this.firebase.collection(this.db, 'chat_messages', userId, 'chat');
        const qUnread = this.firebase.query(chatRef, this.firebase.where('read', '==', false));

        const snapshot = await this.firebase.getDocs(qUnread);

        for (const doc of snapshot.docs) {
         await this.firebase.updateDoc(doc.ref, { read: true });
        }

        // Hide the red dot immediately in UI
            const dot = document.getElementById(`unread-${userId}`);
            if (dot) dot.style.display = 'none';

        } catch (error) {
        console.error('❌ Error marking messages as read:', error);
    }
    }


    renderUserMessages(snapshot) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        container.innerHTML = '';
        
        if (snapshot.empty) {
            this.showEmptyState();
            return;
        }
        
        snapshot.forEach((doc, index) => {
    const message = doc.data();

    // Detect first message
    if (index === 0) {
        console.log("ðŸ“Œ First message:", message.message);

        // Optional: Display in a box
        const firstMsgBox = document.getElementById('firstMessageBox');
        if (firstMsgBox) {
            firstMsgBox.textContent = `First message: ${message.message}`;
        }
    }

    this.createMessageElement(message, container);
});
        
        this.scrollToBottom();
    }

    renderAdminMessages(snapshot) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        container.innerHTML = '';
        
        if (snapshot.empty) {
            this.showEmptyState();
            return;
        }
        
        snapshot.forEach((doc, index) => {
    const message = doc.data();

    // Detect first message
    if (index === 0) {
        console.log("ðŸ“Œ First message:", message.message);

        // Optional: Display in a box
        const firstMsgBox = document.getElementById('firstMessageBox');
        if (firstMsgBox) {
            firstMsgBox.textContent = `First message: ${message.message}`;
        }
    }

    this.createMessageElement(message, container);
});
        
        this.scrollToBottom();
    }

createMessageElement(message, container) {
  const isCurrentUser = message.sender === this.currentUser.uid || 
                        (this.isAdmin && message.sender === 'admin');

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isCurrentUser ? 'sent' : 'received'}`;

  const time = this.formatMessageTime(message.timestamp);

  // 🌟 Handle feedback request messages
     if (message.type === 'feedback-request' && !this.isAdmin) {
         const messageDiv = document.createElement('div');
         messageDiv.className = 'message received';

         messageDiv.innerHTML = `
           <div class="message-bubble">
            <div class="message-content">
            <strong>🌟 Please rate your experience:</strong>
                <div class="star-rating" style="margin-top: 0.5rem;">
               ${[1, 2, 3, 4, 5].map(i => `
                 <i class="fas fa-star" data-rating="${i}" style="cursor:pointer; font-size: 1.3rem; margin: 0 3px; color: #ccc;"></i>
               `).join('')}
             </div>
              </div>
            <div class="message-time">${this.formatMessageTime(message.timestamp)}</div>
           </div>
         `;

          container.appendChild(messageDiv);

         // ✅ Attach event listeners to each star
         const starContainer = messageDiv.querySelector('.star-rating');
         const stars = starContainer.querySelectorAll('i');

         stars.forEach(star => {
           star.addEventListener('click', () => {
             const rating = parseInt(star.getAttribute('data-rating'));
             this.submitStarRating(rating, stars);
           });
         });

         return;
        }


          // Handle feedback-response (show differently to admin)
    if (message.type === 'feedback-response') {
     messageDiv.innerHTML = `
    <div class="message-bubble feedback-response">
      <div class="message-content">
        <i class="fas fa-star" style="color: gold;"></i>
        <strong> Your Rating: ${message.message.replace("⭐ Feedback Rating:", "").trim()} </strong>
      </div>
      <div class="message-time">${time}</div>
    </div>
  `;
    } else {    
        // Default message (text/image/etc.)
    messageDiv.innerHTML = `
    <div class="message-bubble">
      <div class="message-content">
        ${this.renderMessageContent(message.message)}
      </div>
      <div class="message-time">${time}</div>
    </div>
     `;
    }

  container.appendChild(messageDiv);
}


    //----feedback----
    async sendFeedbackRequestTo(userId) {
        try {
             const feedbackPrompt = {
             type: 'feedback-request',
             timestamp: this.firebase.serverTimestamp(),
             sender: 'admin',
             read: false
            };

        await this.firebase.addDoc(
          this.firebase.collection(this.db, 'chat_messages', userId, 'chat'),
          feedbackPrompt
        );

         this.showToast("Feedback request sent!", "success");
        } catch (error) {
        console.error("Error sending feedback request:", error);
        this.showToast("Failed to send feedback request", "error");
         }
    }



    submitStarRating(rating, stars = []) {
     if (!this.currentUser || this.isAdmin) return; // Only users can rate

     const feedbackMessage = {
       message: `⭐ Feedback Rating: ${rating}/5`,
      sender: this.currentUser.uid,
      timestamp: this.firebase.serverTimestamp(),
      read: false,
      type: 'feedback-response'
     };

     // Send to admin
     this.firebase.addDoc(
        this.firebase.collection(this.db, 'chat_messages', this.currentUser.uid, 'chat'),
        feedbackMessage
     );


    this.showToast("Thanks for your feedback!", "success");

    // Highlight selected stars and disable further rating
    stars.forEach(star => {
    star.style.pointerEvents = 'none';
    star.style.color = parseInt(star.dataset.rating) <= rating ? '#ffcc00' : '#ccc';
    });
    
    }


    showEmptyState() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-muted);
            text-align: center;
            padding: 2rem;
        `;
        
        emptyDiv.innerHTML = `
            <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.2rem;">No messages yet</h3>
            <p>Start the conversation by sending a message!</p>
        `;
        
        container.appendChild(emptyDiv);
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || !this.selectedUserId) return;
        
        const sendBtn = document.getElementById('sendBtn');
        const originalContent = sendBtn.innerHTML;
        
        try {
            // Show sending state
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            sendBtn.disabled = true;
            
            const messageData = {
                message: message,
                sender: this.isAdmin ? 'admin' : this.currentUser.uid,
                timestamp: this.firebase.serverTimestamp(),
                read: false
            };
            
            // Determine chat collection path
            const chatPath = this.isAdmin ? 
                `chat_messages/${this.selectedUserId}/chat` :
                `chat_messages/${this.currentUser.uid}/chat`;
            
            await this.firebase.addDoc(
                this.firebase.collection(this.db, chatPath),
                messageData
            );
            
            input.value = '';
            this.updateCharacterCount();
            input.focus();
            
            // Show success
            this.showToast('Message sent!', 'success');
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message. Please try again.');
        } finally {
            // Restore send button
            sendBtn.innerHTML = originalContent;
            sendBtn.disabled = false;
        }
    }

    updateCharacterCount() {
        const input = document.getElementById('messageInput');
        const counter = document.getElementById('charCount');
        
        if (!input || !counter) return;
        
        const count = input.value.length;
        const maxLength = 1000;
        
        counter.textContent = count;
        
        // Update counter color based on remaining characters
        counter.parentElement.classList.remove('warning', 'danger');
        
        if (count > maxLength * 0.8) {
            counter.parentElement.classList.add('warning');
        }
        
        if (count > maxLength * 0.95) {
            counter.parentElement.classList.add('danger');
        }
    }

    handleTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        // Show typing indicator (could be implemented with real-time updates)
        this.typingTimeout = setTimeout(() => {
            // Hide typing indicator
        }, 1000);
    }

    formatMessageTime(timestamp) {
        if (!timestamp) return '';
        
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else {
            date = new Date(timestamp);
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    renderMessageContent(content) {
        const isImage = content.match(/\.(jpeg|jpg|png|gif|webp)$/i) && content.startsWith('http');
         const isAudio = content.match(/\.(webm|mp3|wav)$/i) && content.startsWith('http');

        if (isImage) {
          return `
              <div class="image-message">
              <img src="${content}" alt="Image"
            style="
            max-width: 200px; 
            max-height: 200px; 
            border-radius: 0.5rem;
            object-fit: cover; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
           " />
             <a href="${content}" download 
           class="btn btn-secondary" 
              style="
            margin-top: 0.5rem; 
            display: inline-block; 
            font-size: 0.8rem;
          ">
          <i class="fas fa-download"></i> Download
         </a>
         </div>
         `;
  } else if (isAudio) {
    return `
      <div class="audio-message" style="margin: 0.5rem 0;">
        <audio controls 
          style="
            width: 250px;
            max-width: 100%;
            border-radius: 0.5rem;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          ">
          <source src="${content}" type="audio/webm">
          Your browser does not support the aud]      </div>
     `;
        } else {
     return `<p>${content}</p>`;
     }
    }




    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }

    showMessagesLoading(show) {
        const loading = document.getElementById('messagesLoading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    closeChat() {
        // Unsubscribe from current chat
        if (this.chatUnsubscriber) {
            this.chatUnsubscriber();
            this.chatUnsubscriber = null;
        }
        
        // Hide chat interface and show welcome screen
        document.getElementById('chatInterface').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'flex';
        
        // Clear selected user
        this.selectedUserId = null;
        
        // Remove active states
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.admin-user-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    async clearChatHistory() {
        if (!this.selectedUserId) return;
        
        const confirmed = confirm('Are you sure you want to clear all messages? This action cannot be undone.');
        if (!confirmed) return;
        
        try {
            this.showLoading(true, 'Clearing messages...');
            
            const chatPath = this.isAdmin ? 
                `chat_messages/${this.selectedUserId}/chat` :
                `chat_messages/${this.currentUser.uid}/chat`;
                
            const chatRef = this.firebase.collection(this.db, chatPath);
            const snapshot = await this.firebase.getDocs(chatRef);
            
            const deletePromises = snapshot.docs.map(doc => 
                this.firebase.deleteDoc(doc.ref)
            );
            
            await Promise.all(deletePromises);
            this.showToast('Chat history cleared!', 'success');
            
        } catch (error) {
            console.error('Error clearing chat:', error);
            this.showError('Failed to clear chat history.');
        } finally {
            this.showLoading(false);
        }
    }

    openEmailModal() {
        if (!this.selectedUserId || this.selectedUserId === 'admin') return;
        
        const user = this.users.get(this.selectedUserId);
        if (!user) return;
        
        this.openEmailModalForUser(this.selectedUserId, user.username, user.displayName || user.username);
    }

    openEmailModalForUser(userId, email, displayName) {
        const modal = document.getElementById('emailModal');
        const emailTo = document.getElementById('emailTo');
        const emailSubject = document.getElementById('emailSubject');
        
        if (modal && emailTo && emailSubject) {
            emailTo.value = email;
            emailSubject.value = `Message from Elite Fashions Chat - ${displayName}`;
            modal.classList.add('show');
        }
    }

    closeEmailModal() {
        const modal = document.getElementById('emailModal');
        if (modal) {
            modal.classList.remove('show');
            // Clear form
            document.getElementById('emailForm').reset();
        }
    }


        
        
    filterUsers(searchTerm) {
        const userItems = document.querySelectorAll('.user-item:not(#adminContact)');
        const term = searchTerm.toLowerCase();
        
        let visibleCount = 0;
        
        userItems.forEach(item => {
            const userDetails = item.querySelector('.user-details h4');
            const userName = userDetails ? userDetails.textContent.toLowerCase() : '';
            
            if (userName.includes(term)) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Update user count
        const userCount = document.getElementById('userCount');
        if (userCount) {
            userCount.textContent = visibleCount;
        }
    }

    toggleClearSearch(value) {
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            if (value) {
                clearBtn.classList.add('show');
            } else {
                clearBtn.classList.remove('show');
            }
        }
    }

    refreshUserList() {
        if (this.isAdmin) {
            this.loadAdminUsers();
            this.showToast('User list refreshed!', 'info');
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('show');
        }
    }

    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
        }
    }

    toggleAdminPanel() {
        if (!this.isAdmin) return;
        
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.classList.toggle('show');
        }
    }

    closeAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.classList.remove('show');
        }
    }


// Emoji Picker
    toggleEmojiPicker() {
     const picker = document.getElementById('emojiPicker');
     picker.style.display = (picker.style.display === 'none' || !picker.style.display) ? 'block' : 'none';
    }

    populateEmojis() {
    const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😍','😘','😎','🤩','🥳','😢','😭','😡','😱','👍','🙏'];
     const grid = document.querySelector('#emojiPicker .emoji-grid');
     grid.innerHTML = '';

     emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.className = 'emoji-btn';
      btn.style.fontSize = '1.3rem';
      btn.style.margin = '4px';
      btn.style.border = 'none';
      btn.style.background = 'transparent';
      btn.style.cursor = 'pointer';

    btn.addEventListener('click', () => {
      const input = document.getElementById('messageInput');
      input.value += emoji;
      input.focus();
      document.getElementById('emojiPicker').style.display = 'none';
    });

         grid.appendChild(btn);
     });
    }

    updateStats(totalUsers) {
        const totalUsersElement = document.getElementById('totalUsers');
        const totalChatsElement = document.getElementById('totalChats');
        const onlineUsersElement = document.getElementById('onlineUsers');
        
        if (totalUsersElement) totalUsersElement.textContent = totalUsers;
        if (totalChatsElement) totalChatsElement.textContent = this.users.size;
        if (onlineUsersElement) onlineUsersElement.textContent = '0'; // Could implement real presence
    }

    async updateUserPresence(status) {
        if (!this.currentUser || this.currentUser.uid === 'admin') return;
        
        try {
            const userRef = this.firebase.doc(this.db, 'users_data', this.currentUser.uid);
            await this.firebase.updateDoc(userRef, {
                status: status,
                lastSeen: this.firebase.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating presence:', error);
        }
    }

    startActivityTracking() {
        this.activityCheckInterval = setInterval(() => {
            const inactiveTime = Date.now() - this.lastActivity;
            const fiveMinutes = 5 * 60 * 1000;
            
            if (inactiveTime > fiveMinutes) {
                this.updateUserPresence('away');
            } else {
                this.updateUserPresence('online');
            }
        }, 60000); // Check every minute
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showToast('Notifications enabled!', 'success');
                }
            });
        }
    }

    showNotification(title, body, icon) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: icon || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgVcgbVjtZOurxM5i98pP5tehtZqa0bIUFL2UfyTjNFZ6olqU1gE6DkVfYamQdR9dZVuNgUTROdPExwbX9wQ2sYjkVXNGGAEA4QbG0dc63LjPuskPAiMcJZPsayM2RmjJB2hSIU86szKFPDpTSgvfIO7xGdn-fvmebaJJSN7NXMjCvMnKfDYv9r2SbWc1AX/s1600/1000098381.png'
            });
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('elite-chat-theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('elite-chat-theme', newTheme);
        this.updateThemeIcon(newTheme);
        
        this.showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme activated!`, 'info');
    }

    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    }

    showLoading(show, message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
                const text = overlay.querySelector('p');
                if (text) text.textContent = message;
            } else {
                overlay.classList.add('hidden');
            }
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
            
            setTimeout(() => {
                errorDiv.classList.remove('show');
            }, 5000);
        }
        
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.add('show');
            
            setTimeout(() => {
                successDiv.classList.remove('show');
            }, 5000);
        }
        
        this.showToast(message, 'success');
    }

    clearMessages() {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (errorDiv) errorDiv.classList.remove('show');
        if (successDiv) successDiv.classList.remove('show');
    }

    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        container.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    removeToast(toast) {
        if (toast && toast.parentElement) {
            toast.style.animation = 'toastSlideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }
    }

    cleanupSubscriptions() {
        // Unsubscribe from all listeners
        this.unsubscribers.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.unsubscribers = [];
        
        // Clear chat subscription
        if (this.chatUnsubscriber) {
            this.chatUnsubscriber();
            this.chatUnsubscriber = null;
        }
        
        // Clear activity tracking
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
            this.activityCheckInterval = null;
        }
    }
}

// Add CSS animation for toast slide out
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize the chat application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new EliteFashionsChat();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    if (window.chatApp) {
        window.chatApp.showToast('You are back online!', 'success');
        window.chatApp.updateUserPresence('online');
    }
});

window.addEventListener('offline', () => {
    if (window.chatApp) {
        window.chatApp.showToast('You are offline', 'warning');
        window.chatApp.updateUserPresence('offline');
    }
});


   function send_message() {
  const email1 = document.getElementById("email1").value.trim();
  const status = document.getElementById("status");

  // Input validation
  if (!email1) {
    showStatusMessage("❗ Please fill all fields!", "orange");
    return;
  }

  // Send email using EmailJS
  emailjs.send("service_2gv4w4n", "template_hrl0qqv", {
    email: email1
  }).then(() => {
    showStatusMessage("✅ Message Sent Successfully!", "green");
    document.getElementById("email1").value = "";
  }).catch(error => {
    showStatusMessage("❌ Error sending message!", "red");
    console.error("EmailJS error:", error);
  });
}

function showStatusMessage(message, color) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.style.color = color;
  status.classList.remove("animate");
  void status.offsetWidth; // Restart animation
  status.classList.add("animate");
}

