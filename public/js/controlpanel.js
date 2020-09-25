/**
 * Enable Tooltip everywhere on this page
 */
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

function openSection(evt, secHead) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(secHead).style.display = "block";
    evt.currentTarget.className += " active";
}

const selectrIDs = {};

//////////////////////////////// Helper Functions /////////////////////////////////////////////////
/**
 * An empty indice is an element with value ''
 */
function removeEmptyIndices(array) {
    array.forEach(a => {
        // Not the best solution but accounts for changing indices
        array.forEach(b => {
            if (b == "") {
                array.splice(array.indexOf(b), 1);
            }
        });
    });
    return array;
}

function createSelectElement(options, values, selected, id, classes) {
    let select = document.createElement("select");
    select.classList.add(...classes);
    select.id = id;
    for (let i = 0; i < options.length; i++) {
        let selectedTxt = "";
        if (values[i] == selected) {
            selectedTxt = "selected";
        }
        let optionTxt = `<option value="${values[i]}" ${selectedTxt}>${options[i]}</option>`;
        select.innerHTML += optionTxt;
    }
    return select;
}

function select2Init(id) {
    $(`#${id}`).select2({
        tags: true,
        createTag: function (params) {
            var term = $.trim(params.term);
            var existsVar = false;
            //check if there is any option already
            if($('#keywords option').length > 0){
                $('#keywords option').each(function(){
                    if ($(this).text().toUpperCase() == term.toUpperCase()) {
                        existsVar = true
                        return false;
                    }else{
                        existsVar = false
                    }
                });
                if(existsVar){
                    return null;
                }
                return {
                    id: params.term,
                    text: params.term,
                    newTag: true
                }
            }
            //since select has 0 options, add new without comparing
            else{
                return {
                    id: params.term,
                    text: params.term,
                    newTag: true
                }
            }
        },
        maximumInputLength: 100, // only allow terms up to 100 characters long
        closeOnSelect: true
    });
}

/**
 * Data has to be formated with as the following
 * { 
 *      id: "",
 *      text: ""
 * }
 *  */
function findSelect2Option(id, data) {
    // Set the value, creating a new option if necessary
    if ($(`#${id}`).find("option[value='" + data.id + "']").length) {
        $(`#${id}`).val(data.id).trigger('change');
    } else {
        // Create a DOM Option and pre-select by default
        var newOption = new Option(data.text, data.id, true, true);
        // Append it to the select
        $('#mySelect2').append(newOption).trigger('change');
    }
}
//////////////////////////////// ACTIVITY FUNCTIONS //////////////////////////////////////////////
const editor = "";
/**
 * Prepares the activity data to the correct format for DataTables
 * @param {*} data 
 * @returns A finished 2-D array populated with the correct data fields
 */
//This editFunc isn't use anywhere yet, it was to hopefully get the edit activity to scroll to the actual editing section
function editFunc() {
    window.location = '#anchor-name';
}

function initActModal(addAct) {
    let prefix = "edit-act";
    if(addAct) {
        prefix = "add-act"
    }
    if($(`#${prefix}-checklist`).DataTable()) {
        $(`#${prefix}-checklist`).DataTable().clear();
        $(`#${prefix}-checklist`).DataTable().destroy();
        $(`#${prefix}-checklist tr`).remove();
    }
    $(`#${prefix}-checklist`).DataTable({
        columns: [
            { "title": "Checklist Name", 'searchable': false },
            { "title": "Unit of Measure", 'searchable': false },
            { "title": "", 'searchable': false },
            { "title": "", 'visible': false },
            { "title": "", 'visible': false },
            { "title": "", 'visible': false, 'searchable': false }
        ]
    });
    if($(`#${prefix}-skills`).DataTable()){
        $(`#${prefix}-skills`).DataTable().clear();
        $(`#${prefix}-skills`).DataTable().destroy();
        $(`#${prefix}-skills tr`).remove();
    }
    $(`#${prefix}-skills`).DataTable({
        columns: [
            { "title": "Skill Name", 'searchable': false },
            { "title": "Subskills", 'searchable': false },
            { "title": "", 'searchable': false },
            { "title": "", 'visible': false },
            { "title": "", 'visible': false },
            { "title": "", 'visible': false, 'searchable': false }
        ]
    });
}

function populateAct(data) {
    let finishedArray = [];
    data.forEach((d, i) => {
        finishedArray.push([d['name'],
        `<button class='btn bdrlessBtn' onclick='getEditActivityModal("${d['id']}")'>Edit</button>`,
        `<button class='btn bdrlessBtn btn-danger' onclick='removeActivity("${d['id']}", "${d['name']}")'>Remove</button>`
    ]);
    });
    return finishedArray;
}

/***
 * Populate the activities tables
 */
function initActivitiesTable() {
    fs.collection("Activities").get().then(res => {
        let names = [];
        res.forEach(doc => {
            names.push({
                name: doc.data()['name'],
                id: doc.id
            });
        });
        let data = populateAct(names);
        $(document).ready(function () {
            $('#activities').DataTable({
                autoFill: false,
                data: data,
                columns: [
                    { "title": "Name" },
                    { "title": "", "searchable": false },
                    { "title": "", 'searchable': false }
                ]
            });
        });
    });
}

function removeActivity(id, name) {
    if(confirm(`Are you sure you would like to remove the activity: ${name}`)) {
        fs.collection('Activities').doc(id).delete().then(()=>{
            $('#activities').DataTable().clear();
            $('#activities').DataTable().destroy();
            $('#activities tr').remove();
            document.getElementById('editActivityModal').style = "display: none;";
            initActivitiesTable();
        });
    }
}

function updateActivity(id) {
    let skillsTable = $("#edit-act-skills").DataTable().rows().data();
    let checkTable = $('#edit-act-checklist').DataTable().rows().data();
    let skills = [];
    let checklist = [];
    let activityName = document.getElementById("edit-act-name").value;
    let valid = activityName ? true : false;
    /////////////////////// update to checklist ///////////////////////////////
    for (let i = 0; i < checkTable.length; i++) {
        let id = checkTable[i][5];
        let checkName = document.getElementById("check-" + id).value;
        let checkUnit = document.getElementById("check-unit-" + id).value;
        if(!checkName || !checkUnit) {
            valid = false;
            break;
        }
        checklist.push({ name: checkName, type: checkUnit });
    }
    /////////////////////// update to skills ///////////////////////////////
    for (let i = 0; i < skillsTable.length; i++) {
        let id = skillsTable[i][5];
        let skillName = document.getElementById("skill-" + id).value;
        let subSkills = $("#subskill-" + id).val();
        if(!skillName || !subSkills) {
            valid = false;
            break;
        }
        skills.push({
            skillName: skillName,
            subSkills: subSkills
        });
    }
    let data = { checklist: checklist, name: activityName, skills: skills };

    if(valid) {
        fs.collection('Activities').doc(id).update(data).then(()=>{
            document.getElementById('editActivityModal').style.display = 'none';
            $('#activities').DataTable().clear();
            $('#activities').DataTable().destroy();
            initActivitiesTable();
            initActModal(false);
            alert(`${activityName} has been updated successfully!`);
        }).catch(err => {
            alert(`Could not successfully update ${activityName}: ${err}`);
        });
    } else {
        alert("Could not successfully update activity: Make sure the Activity Name, all Checklist Items, and all Skills are completely filled out.");
    }
}

function addActivityFromModal() {
    let skillsTable = $("#add-act-skills").DataTable().rows().data();
    let checkTable = $('#add-act-checklist').DataTable().rows().data();
    let skills = [];
    let checklist = [];
    let activityName = document.getElementById("add-act-name").value;
    let valid = activityName ? true : false;
    /////////////////////// Adding Checklist ///////////////////////////////
    for (let i = 0; i < checkTable.length; i++) {
        let id = checkTable[i][5];
        let checkName = document.getElementById("check-" + id).value;
        let checkUnit = document.getElementById("check-unit-" + id).value;
        if(!checkName || !checkUnit) {
            valid = false;
            break;
        }
        checklist.push({ name: checkName, type: checkUnit });
    }
    /////////////////////// Adding Skills ///////////////////////////////
    for (let i = 0; i < skillsTable.length; i++) {
        let id = skillsTable[i][5];
        let skillName = document.getElementById("skill-" + id).value;
        let subSkills = $("#subskill-" + id).val();
        if(!skillName || !subSkills) {
            valid = false;
            break;
        }
        skills.push({
            skillName: skillName,
            subSkills: subSkills
        });
    }
    let data = { checklist: checklist, name: activityName, skills: skills };

    if(valid) {
        fs.collection("Activities").add(data).then((docRef) => {
            $(document).ready(function () {
                document.getElementById('addActivityModal').style.display = 'none';
                $('#activities').DataTable().clear();
                $('#activities').DataTable().destroy();
                initActivitiesTable();
                initActModal(true);
                alert(`${activityName} added successfully!`);
            });
        }).catch(err => {
            alert(`Could not successfully add ${activityName}: ${err}`);
        });
    } else {
        alert("Could not successfully add new activity: Make sure the Activity Name, all Checklist Items, and all Skills are completely filled out.");
    }
}

function getEditActivityModal(id) {
    if ($('#edit-act-skills').DataTable()) {
        $('#edit-act-skills').DataTable().clear();
        $('#edit-act-skills').DataTable().destroy();
        $('#edit-act-skills tr').remove();
    }
    fs.collection('Activities').doc(id).get().then(doc => {
        document.getElementById('edit-act-name').value = doc.data()['name'];
        document.getElementById('editActivityModal').style = "display: block";
        ///////////////////////////////////////     init checkList Table /////////////////////////////////////////
        let checklist = []
        doc.data()['checklist'].forEach((checkItem) => {
            let id = checkItem['name'] + Math.random().toString(36).substring(2, 8);
            let temp = [
                `<input type="text" id="${"check-" + id}" class="input" value="${checkItem['name']}">`,
                `<input type="text" id="${"check-unit-" + id}" class="input" value="${checkItem['type']}">`,
                `<button class='btn bdrlessBtn' onclick='removeCheck("${id}", false)'>Remove</button>`,
                checkItem['name'], checkItem['type'], id
            ];
            checklist.push(temp);
        });
        ///////////////////////////////////////     init Skills Table  //////////////////////////////////////////
        doc.data()['skills'].forEach((skill) => {
            let subSkillOptions = "";
            let subSkillStr = "";
            skill['subSkills'].forEach((subSkill) => {
                subSkillOptions += `<option value="${subSkill}" selected> ${subSkill}</option>`;
                subSkillStr += ` ${subSkill}`;
            });
            let id = skill['name'] + Math.random().toString(36).substring(2, 8);
            let insertedRow = document.getElementById('edit-act-skills').insertRow();
            insertedRow.insertCell().innerHTML = `<input type="text" id="${"skill-" + id}" class="input" value="${skill['skillName']}">`;
            insertedRow.insertCell().innerHTML = `<select class="input skill-input" id="${"subskill-" + id}" multiple="multiple">${subSkillOptions}</select>`;
            insertedRow.insertCell().innerHTML = `<button class='btn bdrlessBtn' onclick='removeSkill("${id}", false)'>Remove</button>`;
            insertedRow.insertCell().innerHTML = skill['skillName'];
            insertedRow.insertCell().innerHTML = subSkillStr;
            insertedRow.insertCell().innerHTML = id;
            select2Init("subskill-" + id);
        });
        $(document).ready(function () {
            ////////////////// add data to checklist table //////////////////////////
            if(!$('#edit-act-checklist').DataTable()){
                $('#edit-act-checklist').DataTable({
                    columns: [
                        { "title": "Checklist Name", 'searchable': false },
                        { "title": "Unit of Measure", 'searchable': false },
                        { "title": "", 'searchable': false },
                        { "title": "", 'visible': false },
                        { "title": "", 'visible': false },
                        { "title": "", 'visible': false, 'searchable': false }
                    ]
                });
            }
            $('#edit-act-checklist').DataTable().clear();
            $('#edit-act-checklist').DataTable().rows.add(checklist).draw();
            ////////////////// add data to Skills Table ////////////////////////////
            $('#edit-act-skills').DataTable({
                columns: [
                    { "title": "Skill Name", 'searchable': false },
                    { "title": "Subskills", 'searchable': false },
                    { "title": "", 'searchable': false },
                    { "title": "", 'visible': false },
                    { "title": "", 'visible': false },
                    { "title": "", 'visible': false, 'searchable': false }
                ]
            });
            document.getElementById("update-activity").onclick = function () { updateActivity(id) };
        });
    }).catch(err => { alert(`Could not load Edit Acticity Modal: ${err}`); });
}

function addSkill(addAct) {
    let skillsTableId = "#edit-act-skills";
    if(addAct) {
        skillsTableId = "#add-act-skills";
    }

    let id = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
    // Really ugly method but works...
    $(skillsTableId).on( 'draw.dt', function () {
        select2Init("subskill-" + id);
    } );

    let tempSkill = [
        `<input type="text" id="${"skill-" + id}" class="input" placeholder="Skill Name">`,
        `<select id="${"subskill-" + id}" class="input" multiple="multiple">
        </select>`,
        `<button class='btn bdrlessBtn' onclick='removeSkill("${id}", ${addAct})'>Remove</button>`,
        "Example Skill",
        "example subskill",
        id
    ]

    $(skillsTableId).DataTable().row.add(tempSkill).draw();
}

function removeSkill(id, addAct) {
    let skillTable = addAct ? $('#add-act-skills').DataTable().rows().data() : $('#edit-act-skills').DataTable().rows().data();
    for (let i = 0; i < skillTable.length; i++) {
        let skillID = skillTable[i][5];
        if (skillID == id) {
            skillTable.row(i).remove().draw();
            break;
        }
    }
}

function addCheckListItem(addAct) {
    let checklistTableId = "#edit-act-checklist";
    if(addAct) {
        checklistTableId = "#add-act-checklist";
    }

    let id = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
    let checklist = [
        `<input type="text" id="${"check-" + id}" class="input" placeholder="Checklist Item Name">`,
        `<input type="text" id="${"check-unit-" + id}" class="input" placeholder="Unit of Measurement">`,
        `<button class='btn bdrlessBtn' onclick='removeCheck("${id}", ${addAct})'>Remove</button>`,
        "Example Checklist name", "inches", id
    ]
    
    $(checklistTableId).DataTable().row.add(checklist).draw();
}

function removeCheck(id, addAct) {
    let checkTable = addAct ? $('#add-act-checklist').DataTable().rows().data() : $('#edit-act-checklist').DataTable().rows().data();
    for (let i = 0; i < checkTable.length; i++) {
        let checkID = checkTable[i][5];
        if (checkID == id) {
            checkTable.row(i).remove().draw();
            break;
        }
    }
}

////////////////////////////////////// CAMPER FUNCTIONS /////////////////////////////////////////////
/***
 * Populate the campers tables
 */
function initCampersTable() {
    $(document).ready(function () {
        fs.collection("users").where("priv", "==", "camper").get().then(res => {
            let data = [];
            res.forEach(doc => {
                let pronoun = "They/Them/Theirs";
                // Retrieve Camper Pronouns
                try {
                    if (doc.data()['pronoun']) {
                        pronoun = doc.data()['pronoun'];
                    }
                } catch (err) { //Do Nothing 
                }
                // Retrieve Camper Gender
                let gender = "Non-Binary";
                try {
                    if (doc.data()['gender']) {
                        gender = doc.data()['gender'];
                    }
                } catch (err) { //Do Nothing 
                }
                let birthdate = "1999/07/04";
                try {
                    birthdate = doc.data()['birthdate'];
                } catch (err) { }

                let insertedRow = document.getElementById('campers').insertRow();
                // Insert a cell in the row at cell index 0
                insertedRow.insertCell().innerHTML =
                    `<input type="file" id="camper-upload-${doc.id}" style="display:none" accept="image/*" capture="camera"/> 
                <button id="camper-pic-button-${doc.id}">
                    <img id="camper-profile-pic-${doc.id}" src="../img/user/default/user-480.png" class="img-thumbnail rounded float-left" width="100" height="100">
                </button>`;

                // insertedRow.insertCell().innerHTML = `<img id="camper-profile-pic-${doc.id}" src="../img/user/default/user-480.png" class="img-thumbnail rounded float-left" width="100" height="100">`;
                
                insertedRow.insertCell().innerHTML = `<input type="text" id="${"camper-first" + doc.id}" class="form-control" value="${doc.data()['firstName']}">`;
                // insertedRow.insertCell().innerHTML = `<span id="${"camper-first" + doc.id}" class="form-control" value="${doc.data()['firstName']}">${doc.data()['firstName']}</span>`;
                insertedRow.insertCell().innerHTML = `<input type="text" id="${"camper-last" + doc.id}" class="form-control" value="${doc.data()['lastName']}">`;
                // insertedRow.insertCell().innerHTML = `<span id="${"camper-last" + doc.id}" class="form-control" value="${doc.data()['lastName']}">${doc.data()['lastName']}</span>`;
                insertedRow.insertCell().innerHTML =
                    `<select class="form-control" id="camper-gender${doc.id}"> 
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-Binary">Non-Binary</option>
                </select>`;
                insertedRow.insertCell().innerHTML = `<input type="date" id="camper-dob-${doc.id}" min="1950-01-01" value="${birthdate}">`;
                insertedRow.insertCell().innerHTML =
                    `<select class="form-control" id="camper-pronoun${doc.id}"> 
                        <option value="She/Her/Hers">She/Her/Hers</option>
                        <option value="He/Him/His">He/Him/His</option>
                        <option value="They/Them/Theirs">They/Them/Theirs</option>
                    </select>`;
                insertedRow.insertCell().innerHTML = doc.data()['id'];
                insertedRow.insertCell().innerHTML = `<button class='btn bdrlessBtn' onclick='loadEditCamperButton("${doc.id}", "${doc.data()['id']}", "${birthdate}", "${gender}", "${pronoun}")'>Edit</button>`;
                insertedRow.insertCell().innerHTML = `<button class='btn bdrlessBtn btn-danger' onclick='if(confirm("Are you sure you want to delete this camper? NOTE: THIS ACTION CANNOT BE REVERSED")) { removeCamper("${doc.id}") }'>Remove</button>`;
                insertedRow.insertCell().innerHTML = `<button class='btn bdrlessBtn'>Assessments</button>`;
                insertedRow.insertCell().innerHTML = doc.data()['firstName'];
                insertedRow.insertCell().innerHTML = doc.data()['lastName'];
                insertedRow.insertCell().innerHTML = birthdate;
                insertedRow.insertCell().innerHTML = pronoun;
                insertedRow.insertCell().innerHTML = gender;
                //Load in selected values
                document.getElementById(`camper-pronoun${doc.id}`).value = pronoun;
                document.getElementById(`camper-gender${doc.id}`).value = gender;
                //Load image
                document.getElementById(`camper-pic-button-${doc.id}`).onclick = () => { $(`#camper-upload-${doc.id}`).trigger('click'); };
                loadCamperImage(`camper-profile-pic-${doc.id}`, doc.data()['id']);
                $(`#camper-upload-${doc.id}`).on("change", function () {
                    readURL(this, `camper-profile-pic-${doc.id}`);
                });
            });

            //made gender, dob, pronouns , 'visible': false so they vamoosed
            $('#campers').DataTable({
                columns: [
                    { "title": "Picture", 'searchable': false },
                    { "title": "First Name", 'searchable': false },
                    { "title": "Last Name", 'searchable': false },
                    { "title": "Gender", 'searchable': false, 'visible': false },
                    { "title": "DoB", 'searchable': false, 'visible': false },
                    { "title": "Pronouns", 'searchable': false, 'visible': false },
                    { "title": "UID" },
                    { "title": "" },
                    { "title": "" },
                    { "title": "" },
                    { "title": "", 'visible': false },
                    { "title": "", 'visible': false },
                    { "title": "", 'visible': false },
                    { "title": "", 'visible': false },
                    { "title": "", 'visible': false }
                ]
            });
        });
    });
}

function loadCamperImage(elementID, camperEmail) {
    loadProfilePictureInElement(document.getElementById(elementID), camperEmail);
}
function updateCamperTable() {
    $(document).ready(function () {
        $('#campers').DataTable().clear();
        $('#campers').DataTable().destroy();
        $("#campers tr").remove();
        initCampersTable();
    });
}

function removeCamper(docid) {
    fs.collection('users').doc(docid).get().then((doc) => {
        clearProfilePictures(doc.data()['id']);
        fs.collection('users').doc(docid).delete().then((doc) => {
            updateCamperTable();
            updateGroupsTable();
        });
    });
}

function addCamperFromModal() {
    let file = document.getElementById(`add-camper-pic`).files[0];
    let firstName = document.getElementById("add-camper-fname").value;
    let lastName = document.getElementById("add-camper-lname").value;
    let birthday = document.getElementById("add-camper-birthday").value;
    let gender = document.getElementById("add-camper-gender").value;
    let pronouns = document.getElementById("add-camper-pronouns").value;
    if(!firstName || !lastName || !birthday || !gender || !pronouns) {
        alert("Could not add camper successfully, please make sure all New Athlete Info is filled out.");
    } else {
        let userPayload = generateUser("", firstName, lastName, gender, birthday, "camper", pronouns);
        addUser(userPayload, updateCamperTable).then((camperId) => {
            console.log("Added camper with ID of " + camperId);
            if(file) {
                storageRef.child(`users/${camperId}/profile-picture/` + file.name).put(file).then(() => {
                    alert("Added camper successfully.");
                }).catch(err => {
                    console.log("Could not upload profile picture successfully.");
                });
            } else {
                alert("Added camper successfully.");
            }
            for(elem of document.getElementsByClassName("camper-modal-input")) {
                elem.value = "";
            }
            document.getElementById("add-camper-profile-pic").src = "../img/user/default/user-480.png";
            document.getElementById('addAthleteModal').style.display = 'none';
        }).catch(err => {
            alert("Could not add camper successfully.");
        });
    }
}

function loadEditCamperButton(docId, camperID, birthday, gender, pronouns) {
    document.getElementById("edit-camper-uid").value = docId;
    document.getElementById("edit-camper-camperId").value = camperID;
    document.getElementById('editAthleteModal').style.display = 'block';
    document.getElementById("edit-camper-profile-pic").src = document.getElementById(`camper-profile-pic-${docId}`).src;
    document.getElementById("edit-camper-fname").value = document.getElementById("camper-first" + docId).value;
    document.getElementById("edit-camper-lname").value = document.getElementById("camper-last" + docId).value;
    document.getElementById("edit-camper-birthday").value = birthday;
    document.getElementById("edit-camper-gender").value = gender;
    document.getElementById("edit-camper-pronouns").value = pronouns;
}

function updateCamperFromModal() {
    let docId = document.getElementById("edit-camper-uid").value;
    let camperId = document.getElementById("edit-camper-camperId").value;
    let file = document.getElementById(`edit-camper-pic`).files[0];
    let firstName = document.getElementById("edit-camper-fname").value;
    let lastName = document.getElementById("edit-camper-lname").value;
    let birthday = document.getElementById("edit-camper-birthday").value;
    let gender = document.getElementById("edit-camper-gender").value;
    let pronouns = document.getElementById("edit-camper-pronouns").value;
    if(!firstName || !lastName || !birthday || !gender || !pronouns) {
        alert("Could not edit camper successfully, please make sure all of the Athlete Info is filled out.");
    } else {    
        try {
            clearProfilePictures(camperId,
                storageRef.child(`users/${camperId}/profile-picture/` + file.name).put(file));
        } catch (err) {
            console.log(`The user ${firstName} ${lastName} does not have a profile picture`);
        }

        fs.collection("users").doc(docId).update({
            firstName: firstName,
            lastName: lastName,
            birthdate: birthday,
            gender: gender,
            pronoun: pronouns
        }).then(() => {
            alert("User has been updated successfully!");
            for(elem of document.getElementsByClassName("camper-modal-input")) {
                elem.value = "";
            }
            document.getElementById("edit-camper-profile-pic").src = "../img/user/default/user-480.png";
            document.getElementById('editAthleteModal').style.display = 'none';
            updateCamperTable();
            updateGroupsTable();
        });
    }
}
/////////////////////////////////////////// GROUPS FUNCTIONS ///////////////////////////////////////////

/**
 *  Adds a coach group with the specified coachID
 */
function addCoachGroup(coachID) {
    let data = {
        campers: [],
        coach: coachID,
        year: document.getElementById("yearPicker").value
    };
    fs.collection("Groups").add(data);
}

/***
 * Populate the groups tables
 */
function initGroupsTable() {
    fs.collection("users").where("priv", "==", "camper").get().then(resCamp => {
        campers = {} // Dictionary of camperIDs
        resCamp.forEach(doc => {
            campers[doc.data()['id']] = doc.data();
        });
        fs.collection("users").where("priv", "==", "coach").get().then(resCoach => {
            coaches = {} // Dictionary of coachIDs
            resCoach.forEach(doc => {
                coaches[doc.data()['id']] = doc.data();
                coaches[doc.data()['id']]['hasGroup'] = false;
            });

            fs.collection("users").where("priv", "==", "admin").get().then(resCoach => {
                resCoach.forEach(doc => {
                    coaches[doc.data()['id']] = doc.data();
                    coaches[doc.data()['id']]['hasGroup'] = false;
                });
                fs.collection("Groups").where("year", "==", document.getElementById("yearPicker").value).get().then(res => {
                    let data = [];
                    res.forEach(doc => {
                        let changedDoc = false;
                        let docData = JSON.parse(JSON.stringify(doc.data()));
                        try {
                            let camperNames = "";
                            // let camperSelection = [];
                            let camperOptionHTML = "";
                            doc.data()['campers'].forEach(camperId => {
                                try {
                                    camperName = campers[camperId]['firstName'] + " " + campers[camperId]['lastName'] + " (id:" + camperId + ")";
                                    camperNames += camperName;
                                } catch (err) {
                                    docData['campers'].splice([docData['campers'].indexOf(camperId)], 1);
                                    changedDoc = true;
                                    console.log("Camper with id " + camperId + " has been removed from the list");
                                    // Camper doesn't exist
                                }
                            });
                            Object.keys(campers).forEach(camperId => {
                                try {
                                    let camperName = campers[camperId]['firstName'] + " " + campers[camperId]['lastName'] + " (id:" + camperId + ")";
                                    let optionStr = `<option value="${camperId}" ${(doc.data()['campers'].indexOf(camperId) >= 0 ? 'selected' : '')}> ${camperName}</option>`;
                                    camperOptionHTML += optionStr;
                                    // data = {
                                    //     text: camperName,
                                    //     value: camperId
                                    // };
                                    // if(doc.data()['campers'].indexOf(camperId) >= 0) {
                                    //     data['selected'] = true;
                                    // }
                                    // camperSelection.push(data);
                                } catch (err) {
                                    // Camper doesn't exist
                                }
                            });
                            let coachName = "Coach no longer exist"
                            try {
                                coachName = coaches[doc.data()['coach']]['firstName'] + " " + coaches[doc.data()['coach']]['lastName'] + `(id:${doc.data()['coach']})`;
                                coaches[doc.data()['coach']]['hasGroup'] = true;
                            } catch (err) {
                                // Coach no longer exists
                            }
                            // let select = document.createElement("select"); 
                            // select.id = '#group-'+ doc.id;
                            // select.classList.add('form-control');
                            let insertedRow = document.getElementById('groups').insertRow();
                            // Insert a cell in the row at cell index 0
                            insertedRow.insertCell().innerHTML = coachName;
                            insertedRow.insertCell().innerHTML = `<select class="" id="${"group-" + doc.id}" multiple="multiple">${camperOptionHTML}</select>`;
                            insertedRow.insertCell().innerHTML = `<button class='btn bdrlessBtn' onclick='updateGroupSelectr("${doc.id}")'>Update</button>`;
                            insertedRow.insertCell().innerHTML = camperNames;
                            $("#group-" + doc.id).select2();
                            // if(!(doc.id in selectrIDs)) {
                            //     let sObj = new Selectr("#group-" + doc.id, {
                            //         data: camperSelection,
                            //         multiple:true
                            //     });
                            //     sObj.mobileDevice = false;
                            //     selectrIDs[doc.id] = sObj;
                            // } else {
                            //     let sObj = selectrIDs[doc.id];
                            //     sObj.removeAll();
                            //     sObj.add(camperSelection);
                            // }
                            passed = false;
                        } catch (err) {
                            console.log(err);
                            // DO nothing. Not a valid group.
                        }
                        if (changedDoc) {
                            fs.collection("Groups").doc(doc.id).set(docData);
                        }
                    });
                    $('#groups').DataTable({
                        columns: [
                            { "title": "Coach Name" },
                            {
                                "title": "Athletes",
                                "searchable": false
                            },
                            {
                                "title": "",
                                "searchable": false
                            },
                            // {"title" : "",
                            // "searchable": false},
                            {
                                "title": "",
                                "visible": false
                            }
                        ]
                    });
                    // Check for any inconsistency in the data
                    let reset = false;
                    Object.keys(coaches).forEach(coachId => {
                        if (!coaches[coachId]['hasGroup']) {
                            let coachName = "Coach no longer exist"
                            try {
                                coachName = coaches[coachId]['firstName'] + " " + coaches[coachId]['lastName'] + `(id:${coachId})`;
                                coaches[doc.data()]['hasGroup'] = true;
                            } catch (err) {
                                // Coach no longer exists
                            }
                            addCoachGroup(coachId);
                            reset = true;
                        }
                    });
                    if (reset) {
                        updateGroupsTable();
                    }
                });
            });
        });
    });
}

function updateGroupsTable() {
    $('#groups').DataTable().clear();
    $('#groups').DataTable().destroy();
    $("#groups tr").remove();
    initGroupsTable();
}
function removeGroup(docid) {
    fs.collection('Groups').doc(docid).delete().then(() => {
        updateGroupsTable();
    });
}
function initYearPicker() {
    let years = ['2020'];
    // years.sort();
    for (i = 0; i < years.length; i++) {
        $("#yearPicker").append(`<option value="${years[i]}">${years[i]}</option>`);
    }
    document.getElementById("yearPicker").value = '2020';
    // fs.collection("Groups").get().then(res => {
    //     res.docs.forEach(group => {
    //         if(!years.includes(group.data()['year'])) {
    //             years.push(group.data()['year']);
    //         }
    //     });
    //     years.sort();
    //     for(i = 0; i < years.length; i++) {
    //         $("#yearPicker").append(`<option value="${years[i]}">${years[i]}</option>`);
    //     }
    //     if(years.indexOf(new Date().getFullYear()) < 0){
    //         $("#yearPicker").append(`<option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option>`);
    //     }
    //     document.getElementById("yearPicker").value = new Date().getFullYear();
    // });
}
// function addGroup(){
//     let payload = {
//         coach: "1023",
//         campers: [""]
//     };
//     fs.collection('Groups').add(payload).then(()=> {
//         updateGroupsTable();
//     });
// }
// DEPRECATED FUNCTION - @1
// function updateGroup(docid) {
//     let camperString = document.getElementById("group-" + docid).value;
//     var find = '@';
//     var re = new RegExp(find, 'g');
//     camperString = camperString.replace(re,"").trim();
//     let campers = camperString.split(" ");
//     campers = removeEmptyIndices(campers);
//     let data = {
//         campers: campers,
//         coach: document.getElementById("group-select-" + docid).value
//     };
//     fs.collection("Groups").doc(docid).set(data);
// }
function updateGroupSelectr(docid) {
    let data = {
        campers: $('#group-' + docid).val()
    };
    fs.collection("Groups").doc(docid).update(data).then(() => {
        alert("Updated coach group successfully!");
    });
}

/////////////////////////////////// USERS FUNCTIONS ////////////////////////////////////////////////////
function initUsersTable() {
    $(document).ready(function () {
        fs.collection("users").get().then(res => {
            let userData = JSON.parse(localStorage.getItem("userData"));
            users = [] // Dictionary of userIDs !!!!!!!!!!!!!!!!!!!! IGNORES CAMPERS !!!!!!!!!!!!!!!!!!!
            res.forEach(doc => {
                if (doc.data()['email'] != userData['email']) {
                    if (doc.data()['priv'] != "camper") {
                        let options = ["Admin", "Coach", "Basic", "Parent"];
                        let values = ["admin", "coach", ".", "parent"];
                        let classes = ['form-control'];
                        let select = createSelectElement(options, values, doc.data()['priv'], "users-priv-" + doc.id, classes);
                        let insertedRow = document.getElementById('users').insertRow();
                        // Insert a cell in the row at cell index 0
                        insertedRow.insertCell().innerHTML =
                            `<input type="file" id="user-upload-${doc.id}" style="display:none" accept="image/*" capture="camera"/> 
                        <button id="user-pic-button-${doc.id}">
                            <img id="user-profile-pic-${doc.id}" src="../img/user/default/user-480.png" class="img-thumbnail rounded float-left" width="100" height="100">
                        </button>`;
                        insertedRow.insertCell().innerHTML = doc.data()['firstName'] + " " + doc.data()['lastName'] + " (ID:" + doc.data()['id'] + ")";
                        insertedRow.insertCell().innerHTML = doc.data()['gender'];
                        insertedRow.insertCell().innerHTML = doc.data()['email'];
                        insertedRow.insertCell().innerHTML = doc.data()['creationDate'];
                        insertedRow.insertCell().innerHTML = select.outerHTML;
                        insertedRow.insertCell().innerHTML = `<button class='btn bdrlessBtn' onclick='updateUser("${doc.id}")'>Update</button>`;
                        insertedRow.insertCell().innerHTML = doc.data()['priv'];

                        //Loading images
                        try {
                            document.getElementById(`user-pic-button-${doc.id}`).onclick = () => { $(`#user-upload-${doc.id}`).trigger('click'); };
                            loadCamperImage(`user-profile-pic-${doc.id}`, doc.data()['email']);
                            $(`#user-upload-${doc.id}`).on("change", function () {
                                readURL(this, `user-profile-pic-${doc.id}`);
                            });
                        } catch (err) {
                            console.log(`Something wrong with user : ${doc.data()['firstName']} ${doc.data()['lastName']}`);
                        }
                    }
                }
            });
            $('#users').DataTable({
                columns: [
                    {
                        "title": "Picture",
                        "searchable": false
                    },
                    { "title": "Name" },
                    { "title": "Gender" },
                    { "title": "Email" },
                    { "title": "Created" },
                    {
                        "title": "Role",
                        "searchable": false
                    },
                    {
                        "title": "",
                        "searchable": false
                    },
                    // {"title" : "",
                    //  "searchable": false},
                    {
                        "title": "",
                        "visible": false
                    }
                ]
            });
        });
    });
}
function updateUsersTable() {
    $('#users').DataTable().clear();
    $('#users').DataTable().destroy();
    $("#users tr").remove();
    initUsersTable();
}
function updateUser(docid) {
    let priv = document.getElementById("users-priv-" + docid).value;
    let file = document.getElementById(`user-upload-${docid}`).files[0];
    fs.collection("users").doc(docid).get().then(doc => {
        try {
            clearProfilePictures(doc.data()['email'],
                storageRef.child(`users/${doc.data()['email']}/profile-picture/` + file.name).put(file));
        } catch (err) {
            console.log(`The user ${doc.data()['firstName']} ${doc.data()['lastName']} does not have a profile picture`);
        }
    });

    fs.collection("users").doc(docid).update({
        priv: priv
    }).then(() => {
        alert("User has been updated!");
        updateGroupsTable();
    });
}
function newAccountPasswordReset(firstName, email) {
    firebase.auth().sendPasswordResetEmail(email).then(function () {
        $("#modal-user").modal("hide");
        updateUsersTable();
        alert(`${firstName} has been added successfully! Password reset has been sent to the ${email}`);
    }).catch(function (error) {
        var errorMessage = error.message;
        console.log(errorMessage);
        document.getElementById("modal-user-error").style = "display: block";
        document.getElementById("modal-user-error").innerHTML = errorMessage;
    });
}

function addModalUser() {
    document.getElementById("modal-user-error").style = "display: none";
    let file = document.getElementById(`modal-user-pic`).files[0];
    let firstName = document.getElementById("modal-user-first").value;
    let lastName = document.getElementById("modal-user-last").value;
    let gender = document.getElementById("modal-user-gender").value;
    let priv = document.getElementById("modal-user-priv").value;
    let email = document.getElementById("modal-user-email").value.toLowerCase();
    let password = document.getElementById("modal-user-pass").value;
    if(!firstName || !lastName || !gender || !email || !priv) {
        alert("Could not add new user: Make sure all of the new user's information is filled out.");
    } else {
        if (password.length == 0) {
            password = "password123";
        }
        signUpFB.auth().createUserWithEmailAndPassword(email, password).then(() => {
            console.log("The user has successfully been signed up!");
            let userPayload = generateUser(email, firstName, lastName, gender, "", priv);
            addUser(userPayload, newAccountPasswordReset(firstName, email)).then((camperId) => {
                if(file) {
                    storageRef.child(`users/${email}/profile-picture/` + file.name).put(file).then(() => {
                        console.log("Added user successfully.");
                    }).catch(err => {
                        console.log("Could not upload profile picture successfully.");
                    });
                } else {
                    console.log("Added user successfully.");
                }
                for(elem of document.getElementsByClassName("user-modal-input")) {
                    elem.value = "";
                }
                document.getElementById("modal-user-profile-pic").src = "../img/user/default/user-480.png";
                document.getElementById('addUserModal').style.display = 'none';
            }).catch((err) => {
                alert("Could not add new user to database: " + err);
            });
        }).catch(function (error) {
            var errorMessage = error.message;
            console.log(errorMessage);
            document.getElementById("modal-user-error").style = "display: block";
            document.getElementById("modal-user-error").innerHTML = errorMessage;
        });
    }
}
/**
 * Function to be used only under admin controls
 * @param {} email 
 */
function removeUserData(email) {
    fs.collection("users").get().then(res => {
        res.forEach(doc => {
            if (doc.data()['email'] == email) {
                doc.delete();
                console.log("A document with id : " + doc.id + " has been deleted!");
            }
        });
    });
}
function initUserModal() {
    document.getElementById("modal-user-save").onclick = addModalUser;
    document.getElementById("modal-user-error").style = "display: none";
}

//** MISCELLANEOUS Functions */

function togglePrimaryColor(id) {
    let classes = document.getElementById(id).classList;
    if (classes.contains("cp-toggleColor")) {
        classes.remove("cp-toggleColor");
    } else {
        classes.add("cp-toggleColor");
    }
}

function resetSelectrs() {
    for (let ptr in selectrIDs) {
        if (selectrIDs.hasOwnProperty(ptr)) {
            delete selectrIDs[ptr];
        }
    }
    console.log("I am resetting selectrIDs");
}


