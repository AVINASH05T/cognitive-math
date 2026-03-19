// ===== ADMIN DASHBOARD JAVASCRIPT =====

const token = localStorage.getItem('token');
if (!token) window.location.href = '../login.html';

const user = JSON.parse(localStorage.getItem('user') || '{}');
if (user.role !== 'admin' && user.role !== 'editor') {
    window.location.href = 'student.html';
}

document.getElementById('admin-name').textContent = user.name;

// Mobile menu functions
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
}

function handleMobileLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

// Tab switching
function showTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'overview') loadOverview();
    if (tabId === 'courses') loadCourses();
    if (tabId === 'users') loadUsers();
    if (tabId === 'testimonials') loadTestimonials();
    if (tabId === 'registrations') loadCoursesForSelect();
    if (tabId === 'content') loadContent();
    if (tabId === 'about') loadAboutSections();
    if (tabId === 'social') loadSocialLinks();
    if (tabId === 'announcements') loadCoursesForAnnouncement();
}

// Load overview stats
async function loadOverview() {
    try {
        const users = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        const courses = await fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        
        document.getElementById('overview-students').textContent = users.filter(u => u.role === 'student').length;
        document.getElementById('overview-courses').textContent = courses.length;
        document.getElementById('total-users').textContent = users.length;
        document.getElementById('total-courses-mini').textContent = courses.length;
        
        try {
            const testimonials = await fetch('/api/testimonials/admin', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
            document.getElementById('overview-testimonials').textContent = testimonials.length;
            document.getElementById('total-testimonials-mini').textContent = testimonials.length;
        } catch (err) {
            document.getElementById('overview-testimonials').textContent = '0';
            document.getElementById('total-testimonials-mini').textContent = '0';
        }
        
        document.getElementById('overview-enrollments').textContent = '0';
    } catch (err) {
        console.error('Error loading overview:', err);
    }
}

// ========== ABOUT SECTIONS FUNCTIONS ==========
function addAboutSection(title = '', description = '', icon = 'fa-star') {
    const div = document.createElement('div');
    div.className = 'dynamic-field';
    div.innerHTML = `
        <input type="text" placeholder="Section Title" class="about-title" value="${title}">
        <input type="text" placeholder="Icon (e.g., fa-brain, fa-users)" class="about-icon" value="${icon}">
        <textarea placeholder="Description" class="about-desc" rows="3">${description}</textarea>
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✖ Remove Section</button>
    `;
    document.getElementById('aboutSectionsContainer').appendChild(div);
}

async function loadAboutSections() {
    try {
        const res = await fetch('/api/site-content');
        const data = await res.json();
        
        const container = document.getElementById('aboutSectionsContainer');
        container.innerHTML = '';
        
        if (data.aboutSections && data.aboutSections.length) {
            data.aboutSections.forEach(section => {
                addAboutSection(section.title, section.description, section.icon);
            });
        } else {
            addAboutSection('Cognitive Approach', 'We use proven cognitive learning techniques to make math concepts stick.', 'fa-brain');
            addAboutSection('Individual Attention', 'Small class sizes ensure every student gets the attention they deserve.', 'fa-users');
            addAboutSection('Track Progress', 'Regular assessments and feedback to monitor improvement.', 'fa-chart-line');
        }
    } catch (err) {
        console.error('Error loading about sections:', err);
    }
}

document.getElementById('aboutForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const aboutSections = [];
    document.querySelectorAll('#aboutSectionsContainer .dynamic-field').forEach(div => {
        const title = div.querySelector('.about-title')?.value;
        const description = div.querySelector('.about-desc')?.value;
        const icon = div.querySelector('.about-icon')?.value;
        if (title && description) {
            aboutSections.push({ title, description, icon });
        }
    });

    try {
        const res = await fetch('/api/site-content');
        const data = await res.json();
        data.aboutSections = aboutSections;
        
        const updateRes = await fetch('/api/site-content', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (updateRes.ok) {
            alert('✅ About sections saved successfully!');
        } else {
            alert('Error saving about sections');
        }
    } catch (err) {
        alert('Error saving about sections');
    }
});

// ========== SOCIAL LINKS FUNCTIONS ==========
async function loadSocialLinks() {
    try {
        const res = await fetch('/api/site-content');
        const data = await res.json();
        
        if (data.socialLinks) {
            document.getElementById('facebookUrl').value = data.socialLinks.facebook?.url || '';
            document.getElementById('facebookVisible').checked = data.socialLinks.facebook?.visible || false;
            
            document.getElementById('twitterUrl').value = data.socialLinks.twitter?.url || '';
            document.getElementById('twitterVisible').checked = data.socialLinks.twitter?.visible || false;
            
            document.getElementById('instagramUrl').value = data.socialLinks.instagram?.url || '';
            document.getElementById('instagramVisible').checked = data.socialLinks.instagram?.visible || false;
            
            document.getElementById('youtubeUrl').value = data.socialLinks.youtube?.url || '';
            document.getElementById('youtubeVisible').checked = data.socialLinks.youtube?.visible || false;
            
            document.getElementById('linkedinUrl').value = data.socialLinks.linkedin?.url || '';
            document.getElementById('linkedinVisible').checked = data.socialLinks.linkedin?.visible || false;
        }
    } catch (err) {
        console.error('Error loading social links:', err);
    }
}

document.getElementById('socialForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const socialLinks = {
        facebook: {
            url: document.getElementById('facebookUrl').value,
            visible: document.getElementById('facebookVisible').checked
        },
        twitter: {
            url: document.getElementById('twitterUrl').value,
            visible: document.getElementById('twitterVisible').checked
        },
        instagram: {
            url: document.getElementById('instagramUrl').value,
            visible: document.getElementById('instagramVisible').checked
        },
        youtube: {
            url: document.getElementById('youtubeUrl').value,
            visible: document.getElementById('youtubeVisible').checked
        },
        linkedin: {
            url: document.getElementById('linkedinUrl').value,
            visible: document.getElementById('linkedinVisible').checked
        }
    };

    try {
        const res = await fetch('/api/site-content');
        const data = await res.json();
        data.socialLinks = socialLinks;
        
        const updateRes = await fetch('/api/site-content', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (updateRes.ok) {
            alert('✅ Social links saved successfully!');
        } else {
            alert('Error saving social links');
        }
    } catch (err) {
        alert('Error saving social links');
    }
});

// ========== ANNOUNCEMENT FUNCTIONS ==========
async function loadCoursesForAnnouncement() {
    try {
        const res = await fetch('/api/courses', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const courses = await res.json();
        
        const select = document.getElementById('announceCourseSelect');
        select.innerHTML = '<option value="">Select a course</option>' + 
            courses.map(c => `<option value="${c._id}" data-zoom="${c.zoomLink || ''}">${c.title} - Grade ${c.grade}</option>`).join('');
        
        select.addEventListener('change', updateMessagePreview);
        document.getElementById('courseMessage').addEventListener('input', updateMessagePreview);
    } catch (err) {
        console.error('Error loading courses:', err);
    }
}

function updateMessagePreview() {
    const courseSelect = document.getElementById('announceCourseSelect');
    const message = document.getElementById('courseMessage').value;
    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const zoomLink = selectedOption ? selectedOption.dataset.zoom : '';
    
    let preview = message || 'Type your message...';
    preview = preview.replace(/{link}/g, zoomLink || '[Zoom link will be inserted]');
    
    document.getElementById('messagePreview').textContent = preview;
}

async function sendGlobalAnnouncement() {
    const message = document.getElementById('globalMessage').value.trim();
    if (!message) {
        alert('Please enter a message');
        return;
    }

    try {
        const usersRes = await fetch('/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const users = await usersRes.json();
        
        const students = users.filter(u => u.role === 'student');
        
        let sentCount = 0;
        for (const student of students) {
            if (student.parentPhone) {
                sentCount++;
            }
        }
        
        alert(`✅ Announcement ready! ${sentCount} students will receive this message.\n\nOpening WhatsApp for the first student.`);
        
        if (students.length > 0 && students[0].parentPhone) {
            const phone = students[0].parentPhone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    } catch (err) {
        console.error('Error sending announcement:', err);
        alert('Error sending announcement');
    }
}

async function sendCourseAnnouncement() {
    const courseId = document.getElementById('announceCourseSelect').value;
    const message = document.getElementById('courseMessage').value.trim();
    
    if (!courseId || !message) {
        alert('Please select a course and enter a message');
        return;
    }

    try {
        const courseRes = await fetch(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const course = await courseRes.json();
        
        const regRes = await fetch(`/api/registrations/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const registrations = await regRes.json();
        
        const finalMessage = message.replace(/{link}/g, course.zoomLink || '');
        
        let sentCount = 0;
        for (const reg of registrations) {
            if (reg.user.parentPhone) {
                sentCount++;
            }
        }
        
        alert(`✅ Message ready! ${sentCount} students in this course will receive:\n\n${finalMessage}\n\nOpening WhatsApp for the first student.`);
        
        if (registrations.length > 0 && registrations[0].user.parentPhone) {
            const phone = registrations[0].user.parentPhone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`;
            window.open(whatsappUrl, '_blank');
        }
    } catch (err) {
        console.error('Error sending course announcement:', err);
        alert('Error sending announcement');
    }
}

// ========== COURSE-SPECIFIC MESSAGING ==========
let currentCourseId = '';
let currentCourseZoom = '';

function openCourseMessageModal(courseId, courseName, zoomLink) {
    currentCourseId = courseId;
    currentCourseZoom = zoomLink || '';
    document.getElementById('modalMessage').value = `Your class for ${courseName} is ready! Join here: {link}`;
    document.getElementById('modalPreview').textContent = `Your class for ${courseName} is ready! Join here: ${zoomLink || '[Zoom link]'}`;
    document.getElementById('courseMessageModal').classList.add('active');
}

function closeCourseMessageModal() {
    document.getElementById('courseMessageModal').classList.remove('active');
}

document.getElementById('modalMessage')?.addEventListener('input', function() {
    const preview = this.value.replace(/{link}/g, currentCourseZoom || '[Zoom link]');
    document.getElementById('modalPreview').textContent = preview;
});

async function sendCourseMessage() {
    const message = document.getElementById('modalMessage').value.trim();
    if (!message) {
        alert('Please enter a message');
        return;
    }

    try {
        const regRes = await fetch(`/api/registrations/course/${currentCourseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const registrations = await regRes.json();
        
        const finalMessage = message.replace(/{link}/g, currentCourseZoom);
        
        let sentCount = 0;
        for (const reg of registrations) {
            if (reg.user.parentPhone) {
                sentCount++;
            }
        }
        
        alert(`✅ Message ready! ${sentCount} students will receive:\n\n${finalMessage}\n\nOpening WhatsApp for the first student.`);
        
        if (registrations.length > 0 && registrations[0].user.parentPhone) {
            const phone = registrations[0].user.parentPhone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`;
            window.open(whatsappUrl, '_blank');
        }
        
        closeCourseMessageModal();
    } catch (err) {
        console.error('Error sending message:', err);
        alert('Error sending message');
    }
}

async function sendMessageToAllInCourse() {
    const courseId = document.getElementById('courseSelect').value;
    if (!courseId) return;
    
    try {
        const courseRes = await fetch(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const course = await courseRes.json();
        
        openCourseMessageModal(courseId, course.title, course.zoomLink);
    } catch (err) {
        console.error('Error loading course:', err);
    }
}

// ========== CONTENT EDITOR FUNCTIONS ==========
function addStatField(label = '', value = '') {
    const div = document.createElement('div');
    div.className = 'dynamic-field';
    div.innerHTML = `
        <input type="text" placeholder="Label" class="stat-label" value="${label}">
        <input type="text" placeholder="Value" class="stat-value" value="${value}">
        <input type="file" class="stat-image-file" accept="image/*">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✖ Remove Stat</button>
    `;
    document.getElementById('statsContainer').appendChild(div);
}

function addTeacherField(name = '', qualification = '') {
    const div = document.createElement('div');
    div.className = 'dynamic-field';
    div.innerHTML = `
        <input type="text" placeholder="Name" class="teacher-name" value="${name}">
        <input type="text" placeholder="Qualification" class="teacher-qual" value="${qualification}">
        <input type="file" class="teacher-image-file" accept="image/*">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✖ Remove Teacher</button>
    `;
    document.getElementById('teachersContainer').appendChild(div);
}

function addVideoField(title = '', url = '') {
    const div = document.createElement('div');
    div.className = 'dynamic-field';
    div.innerHTML = `
        <input type="text" placeholder="Video Title" class="video-title" value="${title}">
        <input type="text" placeholder="YouTube URL" class="video-url" value="${url}">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">✖ Remove Video</button>
    `;
    document.getElementById('videosContainer').appendChild(div);
}

document.getElementById('logoFile')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large! Maximum size is 10MB.');
            this.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('logoPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});

async function loadContent() {
    try {
        const res = await fetch('/api/site-content');
        const data = await res.json();

        document.getElementById('heroTagline').value = data.hero?.tagline || '';
        document.getElementById('contactPhone').value = data.contact?.phone || '';
        document.getElementById('contactEmail').value = data.contact?.email || '';

        if (data.logo) {
            document.getElementById('logoPreview').src = data.logo;
            document.getElementById('logoPreview').style.display = 'block';
        }

        document.getElementById('statsContainer').innerHTML = '';
        if (data.stats && data.stats.length) {
            data.stats.forEach(stat => addStatField(stat.label, stat.value));
        } else {
            addStatField('Students', '100+');
            addStatField('Courses', '10+');
        }

        document.getElementById('teachersContainer').innerHTML = '';
        if (data.teachers && data.teachers.length) {
            data.teachers.forEach(teacher => addTeacherField(teacher.name, teacher.qualification));
        } else {
            addTeacherField('Eswari', 'Math Expert');
        }

        document.getElementById('videosContainer').innerHTML = '';
        if (data.videos && data.videos.length) {
            data.videos.forEach(video => addVideoField(video.title, video.url));
        }
    } catch (err) {
        console.error('Error loading content:', err);
    }
}

document.getElementById('contentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    let hasError = false;

    const logoFile = document.getElementById('logoFile').files[0];
    if (logoFile) {
        if (logoFile.size > 10 * 1024 * 1024) {
            alert('Logo file too large!');
            hasError = true;
        }
        formData.append('logo', logoFile);
    }

    const heroImage = document.getElementById('heroImage').files[0];
    if (heroImage) {
        if (heroImage.size > 10 * 1024 * 1024) {
            alert('Hero image too large!');
            hasError = true;
        }
        formData.append('heroBackground', heroImage);
    }

    if (hasError) return;

    formData.append('heroTagline', document.getElementById('heroTagline').value);
    formData.append('contactPhone', document.getElementById('contactPhone').value);
    formData.append('contactEmail', document.getElementById('contactEmail').value);

    const stats = [];
    let statIndex = 0;
    document.querySelectorAll('#statsContainer .dynamic-field').forEach((div) => {
        const label = div.querySelector('.stat-label')?.value;
        const value = div.querySelector('.stat-value')?.value;
        const file = div.querySelector('.stat-image-file')?.files[0];
        
        if (label && value) {
            stats.push({ label, value });
            if (file) {
                formData.append(`statImage${statIndex}`, file);
            }
            statIndex++;
        }
    });
    formData.append('stats', JSON.stringify(stats));

    const teachers = [];
    let teacherIndex = 0;
    document.querySelectorAll('#teachersContainer .dynamic-field').forEach((div) => {
        const name = div.querySelector('.teacher-name')?.value;
        const qual = div.querySelector('.teacher-qual')?.value;
        const file = div.querySelector('.teacher-image-file')?.files[0];
        
        if (name && qual) {
            teachers.push({ name, qualification: qual });
            if (file) {
                formData.append(`teacherImage${teacherIndex}`, file);
            }
            teacherIndex++;
        }
    });
    formData.append('teachers', JSON.stringify(teachers));

    const videos = [];
    document.querySelectorAll('#videosContainer .dynamic-field').forEach(div => {
        const title = div.querySelector('.video-title')?.value;
        const url = div.querySelector('.video-url')?.value;
        if (title && url) videos.push({ title, url });
    });
    formData.append('videos', JSON.stringify(videos));

    try {
        const res = await fetch('/api/site-content/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const responseData = await res.json();

        if (res.ok) {
            alert('✅ Content saved successfully!');
        } else {
            alert('❌ Error saving content: ' + (responseData.message || 'Unknown error'));
        }
    } catch (err) {
        alert('❌ Error saving content: ' + err.message);
    }
});

// ========== COURSE FUNCTIONS ==========
function showCourseForm() {
    document.getElementById('courseForm').style.display = 'block';
}

function hideCourseForm() {
    document.getElementById('courseForm').style.display = 'none';
    document.getElementById('courseDataForm').reset();
    document.getElementById('courseId').value = '';
}

async function loadCourses() {
    try {
        const res = await fetch('/api/courses', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const courses = await res.json();
        
        const tbody = document.getElementById('courses-list');
        
        if (courses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No courses found</td></tr>';
            return;
        }

        tbody.innerHTML = courses.map(c => `
            <tr>
                <td><img src="${c.image || 'https://img.icons8.com/fluency/96/000000/math.png'}" style="width:40px; height:40px; object-fit:cover; border-radius:5px;"></td>
                <td>${c.title}</td>
                <td>${c.grade}</td>
                <td>${c.price === 0 ? 'FREE' : '₹' + c.price}</td>
                <td><span class="badge ${c.isActive ? 'badge-success' : 'badge-warning'}">${c.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn-action btn-edit" onclick="editCourse('${c._id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-action btn-delete" onclick="deleteCourse('${c._id}')"><i class="fas fa-trash"></i> Del</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading courses:', err);
    }
}

async function editCourse(id) {
    try {
        const res = await fetch(`/api/courses/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const c = await res.json();
        
        document.getElementById('courseId').value = c._id;
        document.getElementById('courseTitle').value = c.title;
        document.getElementById('courseGrade').value = c.grade;
        document.getElementById('courseSubject').value = c.subject;
        document.getElementById('courseBoard').value = c.board;
        document.getElementById('courseDescription').value = c.description || '';
        document.getElementById('coursePrice').value = c.price;
        document.getElementById('courseDuration').value = c.duration || '';
        document.getElementById('courseTiming').value = c.timing || '';
        document.getElementById('courseStaff').value = c.assignedStaff || '';
        document.getElementById('courseZoomLink').value = c.zoomLink || '';
        document.getElementById('courseActive').checked = c.isActive;
        
        document.getElementById('courseFormTitle').textContent = 'Edit Course';
        showCourseForm();
    } catch (err) {
        alert('Error loading course');
    }
}

async function deleteCourse(id) {
    if (!confirm('Delete this course?')) return;
    
    try {
        await fetch(`/api/courses/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        loadCourses();
    } catch (err) {
        alert('Error deleting course');
    }
}

document.getElementById('courseDataForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('courseId').value;
    const formData = new FormData();
    
    formData.append('title', document.getElementById('courseTitle').value);
    formData.append('grade', document.getElementById('courseGrade').value);
    formData.append('subject', document.getElementById('courseSubject').value);
    formData.append('board', document.getElementById('courseBoard').value);
    formData.append('description', document.getElementById('courseDescription').value);
    formData.append('price', document.getElementById('coursePrice').value);
    formData.append('duration', document.getElementById('courseDuration').value);
    formData.append('timing', document.getElementById('courseTiming').value);
    formData.append('assignedStaff', document.getElementById('courseStaff').value);
    formData.append('zoomLink', document.getElementById('courseZoomLink').value);
    formData.append('isActive', document.getElementById('courseActive').checked);
    
    const courseImage = document.getElementById('courseImageFile').files[0];
    if (courseImage) {
        if (courseImage.size > 10 * 1024 * 1024) {
            alert('Course image too large!');
            return;
        }
        formData.append('courseImage', courseImage);
    }

    try {
        const url = id ? `/api/courses/${id}` : '/api/courses';
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (res.ok) {
            alert(`✅ Course ${id ? 'updated' : 'created'} successfully!`);
            hideCourseForm();
            loadCourses();
        } else {
            const data = await res.json();
            alert('❌ Error saving course: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        alert('❌ Error saving course: ' + err.message);
    }
});

// ========== USER FUNCTIONS ==========
function showAddAdminForm() {
    document.getElementById('addAdminForm').style.display = 'block';
}

function hideAddAdminForm() {
    document.getElementById('addAdminForm').style.display = 'none';
    document.getElementById('adminCreateForm').reset();
}

document.getElementById('adminCreateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const adminData = {
        name: document.getElementById('adminName').value,
        email: document.getElementById('adminEmail').value,
        password: document.getElementById('adminPassword').value,
        role: document.getElementById('adminRole').value
    };

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(adminData)
        });

        if (res.ok) {
            alert('✅ Admin created successfully!');
            hideAddAdminForm();
            loadUsers();
        } else {
            const data = await res.json();
            alert('❌ Error: ' + data.message);
        }
    } catch (err) {
        alert('Error creating admin');
    }
});

async function loadUsers() {
    try {
        const res = await fetch('/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const users = await res.json();
        
        const tbody = document.getElementById('users-list');
        
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === 'admin' ? 'badge-success' : u.role === 'editor' ? 'badge-info' : 'badge-warning'}">${u.role}</span></td>
                <td>${u.parentPhone || '-'}</td>
                <td>${u.points || 0}</td>
                <td>
                    <button class="btn-action btn-delete" onclick="deleteUser('${u._id}')"><i class="fas fa-trash"></i> Del</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    
    try {
        await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        loadUsers();
        loadOverview();
    } catch (err) {
        alert('Error deleting user');
    }
}

// ========== TESTIMONIAL FUNCTIONS ==========
async function loadTestimonials() {
    try {
        const res = await fetch('/api/testimonials/admin', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const testimonials = await res.json();
        
        const tbody = document.getElementById('testimonials-list');
        
        if (testimonials.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No testimonials</td></tr>';
            return;
        }

        tbody.innerHTML = testimonials.map(t => `
            <tr>
                <td>${t.name}</td>
                <td>${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</td>
                <td>${t.comment.substring(0, 50)}${t.comment.length > 50 ? '...' : ''}</td>
                <td><span class="badge ${t.approved ? 'badge-success' : 'badge-warning'}">${t.approved ? 'Approved' : 'Pending'}</span></td>
                <td>
                    <button class="btn-action ${t.approved ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleApprove('${t._id}', ${!t.approved})">
                        ${t.approved ? 'Unapprove' : 'Approve'}
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading testimonials:', err);
    }
}

async function toggleApprove(id, approved) {
    try {
        await fetch(`/api/testimonials/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ approved })
        });
        loadTestimonials();
    } catch (err) {
        alert('Error updating testimonial');
    }
}

// ========== REGISTRATION FUNCTIONS ==========
async function loadCoursesForSelect() {
    try {
        const res = await fetch('/api/courses', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const courses = await res.json();
        
        const select = document.getElementById('courseSelect');
        select.innerHTML = '<option value="">Select a course</option>' + 
            courses.map(c => `<option value="${c._id}">${c.title} - Grade ${c.grade}</option>`).join('');
    } catch (err) {
        console.error('Error loading courses:', err);
    }
}

async function loadRegistrations() {
    const courseId = document.getElementById('courseSelect').value;
    if (!courseId) return;

    try {
        const res = await fetch(`/api/registrations/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const registrations = await res.json();
        
        document.getElementById('sendAllBtn').style.display = registrations.length ? 'inline-block' : 'none';
        
        const tbody = document.getElementById('registrations-list');
        
        if (registrations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No registrations found</td></tr>';
            return;
        }

        tbody.innerHTML = registrations.map(r => `
            <tr>
                <td>${r.user.name}</td>
                <td>${r.user.parentPhone || '-'}</td>
                <td>${r.user.email}</td>
                <td><span class="badge ${r.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}">${r.paymentStatus}</span></td>
                <td>
                    <span class="badge ${r.attended ? 'badge-success' : 'badge-warning'}" 
                          onclick="markAttendance('${r._id}', ${!r.attended})" style="cursor: pointer;">
                        ${r.attended ? '✅ Attended' : '⏳ Mark Attend'}
                    </span>
                </td>
                <td>
                    <button class="btn-action btn-whatsapp" onclick="sendWhatsApp('${r.user.parentPhone}', '${r.course?.title}', '${r.course?.zoomLink}')">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading registrations:', err);
    }
}

async function markAttendance(regId, attended) {
    try {
        await fetch(`/api/registrations/${regId}/attendance`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ attended })
        });
        loadRegistrations();
    } catch (err) {
        alert('Error marking attendance');
    }
}

function sendWhatsApp(phone, courseName, zoomLink) {
    if (!zoomLink) {
        alert('Please add a Zoom link to the course first');
        return;
    }
    
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    if (!cleanPhone) {
        alert('No phone number available');
        return;
    }
    
    const message = `*Cognitive Math*\n\nYour class for *${courseName}* is ready!\n\n🔗 Join: ${zoomLink}`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ========== LOGOUT ==========
document.getElementById('logoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
});

document.getElementById('mobileLogoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const mobileMenu = document.getElementById('mobileMenu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenu && mobileMenu.classList.contains('active') && 
        !mobileMenu.contains(e.target) && 
        !toggle.contains(e.target)) {
        mobileMenu.classList.remove('active');
    }
});

// Initialize
loadOverview();