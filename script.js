/*jslint esversion: 6*/

let CharacterLines = new Map();

let lineIndex = 0;

$(document).ready(() => {
    saveObject = data;
    FindCharacterLines(saveObject);

    let url = new URL(window.location.href);
    let defaultCharacter = url.searchParams.get("c") || "Cynthia";
    $("select#characters").val(defaultCharacter);
    UpdateDialogueBox();

    // When we pick a character from the dropdown.
    $("select#characters").change(UpdateDialogueBox);
    $("select#context-depth").change(UpdateDialogueBox);
});

function UpdateDialogueBox(){
    lineIndex = 0;
    let dialogueBox = $("div#dialogue");
    let contextDepth = $("select#context-depth").val();

    dialogueBox.empty();

    for (let node of CharacterLines.get($("select#characters").val())) {
        dialogueBox.append(GenerateDialgueBlock(node, saveObject.nodes, contextDepth));
    }
}

function GenerateDialgueBlock(node, nodelist, contextDepth) {
    let returnValue = $("<table/>");
    let parentNodes = getPreviousNodes(node, nodelist, contextDepth);
    console.log("Parent nodes: ", getPreviousNodes(node, nodelist, contextDepth));
    lineIndex++;

    for (let path of parentNodes) {
        let lastNode = path[path.length-1];

        if (contextDepth >= 3) {
            path.push(nodelist.find(node => node.id === lastNode.outbound[0].id));
            path.forEach((node, index) => {
                returnValue.append(printNode(node, lineIndex, index === path.length - 2));
            });
        } else {
            path.forEach((node, index) =>{
                returnValue.append(printNode(node, lineIndex, index === path.length - 1));
            });
        }
    }
    returnValue = $("</p>").append(returnValue);
    if (lineIndex%2 != true) {
        returnValue.addClass("alternate even");
    } else {
        returnValue.addClass("alternate odd");
    }
    return returnValue;
}

function getPreviousNodes(node, nodelist, depth = 1) {
    if (depth < 1) return [[node]];

    let parentNodes = getParentNodes(node, nodelist);

    let newArray = [];

    if (depth > 1) {
        let returnArray = [];
        for (let parentNode of parentNodes) {
            returnArray.push(...getPreviousNodes(parentNode, nodelist, depth - 1).map(nodeArray => {
                nodeArray.push(node);
                return nodeArray;
            }));
        }
        return returnArray;
    }

    return parentNodes.map(parentNode => [parentNode, node]);
}

function getParentNodes(node, nodelist) {
    return nodelist.filter(
        preceedingNode => preceedingNode.outbound.some(
            link => link.id === node.id
        )
    );
}

function printNode(node, lineIndex, primary = false) {
    let returnValue;
    if (node.type === "dialogue.Text") {
        let text = node.text;

        // Filter out lookup markup. Example: {the school|RevolverAcademy}
        text = text.replace(/\{([^\{\}\|]*)(\|.*?)?\}/g, '$1');
        // Filter out emotion markup. Example: [Aaaarghh!|s]
        text = text.replace(/\[([^\[\]\|]*)(\|.*?)?\]/g, '$1');

        if (primary) {
            returnValue = `<tr><td style="width:100px">${lineIndex}</td ><td><span class="actor-name">${node.actor}:</span></td><td>${text}</td></tr>`;
        } else {
            returnValue = `<tr class="context"><td></td><td><span class="actor-name">${node.actor}:</span></td><td>${text}</td></tr>`;
        }
    }

    return returnValue;
}

function FindCharacterLines(saveObject){
    for (let node of saveObject.nodes) {
        if (node.type !== "dialogue.Text") {
            continue;
        }

        if (!CharacterLines.has(node.actor)) {
            CharacterLines.set(node.actor, []);
        }

        let characterDialogueList = CharacterLines.get(node.actor);
        characterDialogueList.push(node);
    }

    for (let characterName of CharacterLines.keys()) {
        let option = $(`<option value="${characterName}">${characterName}</option>`);
        $("select#characters").append(option);
    }
}