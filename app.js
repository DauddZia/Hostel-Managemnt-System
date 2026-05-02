// Mock Data
const roomCapacities = {
    'Single': 1,
    'Double': 2,
    'Triple': 3
};

const state = {
    rooms: [],
    students: [
        { id: 'S001', name: 'Ali Ahmed', email: 'ali@example.com' },
        { id: 'S002', name: 'Bilal Khan', email: 'bilal@example.com' },
        { id: 'S003', name: 'Zain Ul Abideen', email: 'zain@example.com' },
        { id: 'S004', name: 'Hamza Sheikh', email: 'hamza@example.com' },
        { id: 'S005', name: 'Umar Farooq', email: 'umar@example.com' },
        { id: 'S006', name: 'Osama Bin Tariq', email: 'osama@example.com' },
        { id: 'S007', name: 'Mustafa Hassan', email: 'mustafa@example.com' },
        { id: 'S008', name: 'Saad Malik', email: 'saad@example.com' },
    ]
};

// Persistence Logic
function saveState() {
    localStorage.setItem('hostel_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('hostel_state');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.rooms = parsed.rooms.map(r => {
            // Migrate old 'student' string field → 'students' array
            const students = r.students || (r.student ? [r.student] : []);
            const capacity = roomCapacities[r.type] || 1;
            // Always recalculate status from students count (fixes stale localStorage data)
            const status = r.status === 'maintenance' ? 'maintenance'
                : (students.length >= capacity ? 'occupied' : 'available');
            return { ...r, students, status };
        });
        state.students = parsed.students;
        // Re-save the corrected state to clean up localStorage
        localStorage.setItem('hostel_state', JSON.stringify(state));
        return true;
    }
    return false;
}

// Generate 50 Rooms if no state exists
function initRooms() {
    if (loadState()) return; // Skip if state loaded

    const types = ['Single', 'Double', 'Triple'];
    const prices = [15000, 10000, 7000];
    
    for (let i = 1; i <= 50; i++) {
        const typeIndex = i % 3;
        const type = types[typeIndex];
        const capacity = roomCapacities[type];
        
        // Mock initial allocation
        let roomStudents = [];
        let status = 'available';
        
        if (i <= 20) {
            // Fill some rooms
            const studentCount = (i % capacity) + 1;
            for (let j = 0; j < studentCount; j++) {
                roomStudents.push(state.students[(i + j) % state.students.length].name);
            }
            status = roomStudents.length === capacity ? 'occupied' : 'available';
        } else if (i === 45) {
            status = 'maintenance';
        }
        
        state.rooms.push({
            id: (100 + i).toString(),
            type: type,
            price: prices[typeIndex],
            status: status,
            students: roomStudents
        });
    }
    saveState();
}

initRooms();

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    renderRooms();
    populateAllocationForm();
    renderCheckoutList();
    renderRecentActivities();
});

function updateDashboard() {
    const stats = {
        totalRooms: state.rooms.length,
        occupied: state.rooms.filter(r => r.status === 'occupied').length,
        available: state.rooms.filter(r => r.status === 'available').length,
        students: state.students.length
    };

    const elements = {
        occupied: document.getElementById('stat-occupied'),
        available: document.getElementById('stat-available'),
        totalStudents: document.getElementById('stat-students'),
        totalRooms: document.getElementById('stat-total-rooms')
    };

    if (elements.occupied) elements.occupied.textContent = stats.occupied;
    if (elements.available) elements.available.textContent = stats.available;
    if (elements.totalStudents) elements.totalStudents.textContent = stats.students;
    if (elements.totalRooms) elements.totalRooms.textContent = stats.totalRooms;
}

function renderRecentActivities() {
    const tableBody = document.getElementById('recent-activities');
    if (!tableBody) return;

    const activities = [
        { type: 'New Allocation', student: 'Ali Ahmed', room: '105', time: '2 hours ago' },
        { type: 'Room Vacated', student: 'Zahid Khan', room: '208', time: '4 hours ago' },
        { type: 'New Allocation', student: 'Bilal Khan', room: '112', time: '5 hours ago' },
        { type: 'Maintenance', student: '---', room: '145', time: 'Yesterday' },
    ];

    tableBody.innerHTML = activities.map(act => `
        <tr class="fade-in">
            <td>${act.type}</td>
            <td>${act.student}</td>
            <td>${act.room}</td>
            <td>${act.time}</td>
        </tr>
    `).join('');
}

function renderRooms() {
    const tableBody = document.getElementById('rooms-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = state.rooms.map(room => `
        <tr class="fade-in">
            <td>${room.id}</td>
            <td>${room.type}</td>
            <td>Rs. ${room.price.toLocaleString()}</td>
            <td><span class="status-badge status-${room.status}">${room.status}</span></td>
            <td>${room.students.length > 0 ? room.students.join(', ') : '---'}</td>
        </tr>
    `).join('');
}

function populateAllocationForm() {
    const studentSelect = document.getElementById('student-select');
    const roomSelect = document.getElementById('room-select');

    if (studentSelect) {
        studentSelect.innerHTML = '<option value="">Select Existing Student</option>' + 
            state.students.map(s => `<option value="${s.id}">${s.name} (${s.id})</option>`).join('') +
            '<option value="NEW">-- Add New Student --</option>';
    }

    if (roomSelect) {
        roomSelect.innerHTML = '<option value="">Select Room</option>' + 
            state.rooms.filter(r => r.status === 'available')
                .map(r => `<option value="${r.id}">Room ${r.id} (${r.type})</option>`).join('');
    }
}

function renderCheckoutList() {
    const checkoutList = document.getElementById('checkout-list');
    if (!checkoutList) return;

    const roomsWithStudents = state.rooms.filter(r => r.students && r.students.length > 0);
    
    if (roomsWithStudents.length === 0) {
        checkoutList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No occupied rooms found.</td></tr>';
        return;
    }

    let rows = [];
    roomsWithStudents.forEach(room => {
        room.students.forEach(student => {
            rows.push(`
                <tr class="fade-in">
                    <td>${room.id}</td>
                    <td>${student}</td>
                    <td>${room.type}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="openVacateModal('${room.id}', '${student}')">
                            Vacate
                        </button>
                    </td>
                </tr>
            `);
        });
    });

    checkoutList.innerHTML = rows.join('');
}

// Toggle New Student Input
window.toggleNewStudent = (val) => {
    const container = document.getElementById('new-student-container');
    if (container) {
        container.style.display = (val === 'NEW') ? 'block' : 'none';
    }
};

// Actions
window.handleAllocation = (event) => {
    event.preventDefault();
    const studentId = document.getElementById('student-select').value;
    const newStudentName = document.getElementById('new-student-name').value;
    const roomId = document.getElementById('room-select').value;

    if (!roomId) {
        alert('Please select a room.');
        return;
    }

    let studentName = '';
    if (studentId === 'NEW') {
        if (!newStudentName) {
            alert('Please enter the new student name.');
            return;
        }
        studentName = newStudentName;
        const newId = 'S' + (state.students.length + 1).toString().padStart(3, '0');
        state.students.push({ id: newId, name: studentName, email: studentName.toLowerCase().replace(/ /g, '') + '@example.com' });
    } else if (studentId) {
        studentName = state.students.find(s => s.id === studentId).name;
    } else {
        alert('Please select a student.');
        return;
    }

    const roomIndex = state.rooms.findIndex(r => r.id == roomId);
    if (roomIndex !== -1) {
        const room = state.rooms[roomIndex];
        const capacity = roomCapacities[room.type];
        
        if (room.students.length >= capacity) {
            alert('This room is already full!');
            return;
        }

        room.students.push(studentName);
        room.status = room.students.length === capacity ? 'occupied' : 'available';
        
        saveState();
        alert(`Successfully allocated Room ${roomId} to ${studentName}!`);
        window.location.href = 'dashboard.html';
    }
};

window.openVacateModal = (roomId, studentName) => {
    const modal = document.getElementById('vacate-modal');
    const roomIdDisplay = document.getElementById('vacate-room-id-display');
    const roomIdHidden = document.getElementById('vacate-room-id-hidden');
    const studentNameHidden = document.getElementById('vacate-student-name-hidden');
    
    if (modal && roomIdDisplay && roomIdHidden) {
        roomIdDisplay.textContent = `${studentName} from Room ${roomId}`;
        roomIdHidden.value = roomId;
        if (studentNameHidden) studentNameHidden.value = studentName;
        modal.style.display = 'flex';
    } else {
        handleCheckout(roomId, studentName);
    }
};

window.closeVacateModal = () => {
    const modal = document.getElementById('vacate-modal');
    if (modal) modal.style.display = 'none';
};

window.confirmVacate = () => {
    const roomId = document.getElementById('vacate-room-id-hidden').value;
    const studentName = document.getElementById('vacate-student-name-hidden')?.value;
    handleCheckout(roomId, studentName);
    closeVacateModal();
};

window.handleCheckout = (roomId, studentName) => {
    const roomIndex = state.rooms.findIndex(r => String(r.id) === String(roomId));
    
    if (roomIndex !== -1) {
        const room = state.rooms[roomIndex];
        
        // Remove specific student or all if none specified
        if (studentName) {
            room.students = room.students.filter(s => s !== studentName);
            state.students = state.students.filter(s => s.name !== studentName);
        } else {
            // Fallback for old data or if no student specified
            room.students.forEach(s => {
                state.students = state.students.filter(st => st.name !== s);
            });
            room.students = [];
        }

        // Update room status
        room.status = room.students.length === roomCapacities[room.type] ? 'occupied' : 'available';
        
        saveState();
        alert(`${studentName || 'Room'} has been vacated successfully.`);
        window.location.reload(); 
    } else {
        console.error("Room not found:", roomId);
    }
};


// Modal Logic for Add Room
window.handleAddRoom = () => {
    const modal = document.getElementById('add-room-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeModal = () => {
    const modal = document.getElementById('add-room-modal');
    if (modal) modal.style.display = 'none';
};

window.handleAddRoomSubmit = () => {
    const id = document.getElementById('modal-room-id').value;
    const type = document.getElementById('modal-room-type').value;
    const price = document.getElementById('modal-room-price').value;

    if (!id || !type || !price) return;

    if (state.rooms.find(r => r.id == id)) {
        alert("Room number already exists!");
        return;
    }

    state.rooms.push({
        id: id,
        type: type,
        price: parseInt(price),
        status: 'available',
        students: []
    });

    saveState();
    renderRooms();
    updateDashboard();
    closeModal();
    alert(`Room ${id} added successfully!`);
};



