/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var yesterdayString;
var newGridRows=[];
var categories;
var transactions;
$(init);

function init() {
	setupMainTabs();
	$.when(getCategories()).then(getTransactions());
	setupAddPage();
	setupCategoriesPage();
}

function setupMainTabs() {
	$("#mainTabs").tabs({
		activate: function(event ,ui){
		},
		active:null
	});
}

function getCategories() {
	return $.getJSON("controller.php",{func:"getCategories"},setupCategories);
}

function setupCategories(data) {
	categories=data;
	setupCategoriesPage();
}

function getTransactions() {
	return $.getJSON("controller.php",{func:"getTransactions"},gotTransactions);
}

function setupCategoriesPage() {
	$("#categoriesGrid").jsGrid({
        
        width: "100%",
        sorting: true,
		data:categories,
        deleteConfirm: "Do you really want to delete the client?",
		inserting: true,
        editing: true,
		noDataContent:null,
        fields: [
            { name:"id",title: "ID", type: "number",readOnly:true},
			{ name:"name",title: "Namn", type: "text"},
            { name: "parent", title:"Parent", type: "select",items:[]},
			{
                type: "control",
                modeSwitchButton: false,
                editButton: false
            }
        ],
		onItemInserted:categoryInserted,
		onItemDeleted:categoryDeleted
    });
}

function categoryDeleted(event) {
	var categoryId=event.item.id;
	var promise=$.post("controller.php", {func:"deleteCategory",id:categoryId},null,"json");
}

function categoryInserted(event) {
	var name=event.item.name;
	var promise=$.post("controller.php", {func:"createCategory",name:name},categoryCreated,"json");
	promise.customData={item:event.item};
	promise.done=setupRowsGrid;
	
	function categoryCreated(data,message,promise) {
		$("#categoriesGrid").jsGrid("updateItem", promise.customData.item,{ id: data.id});
		setupRowsGrid();
	}
}

function gotTransactions(rows) {
	transactions=[];
	var numRows=rows.length;
	for (var i=0; i<numRows; ++i) {
		var rowData=rows[i];
		var row={};
		row.id=rowData.id;
		row.date=rowData.date;
		row.categoryId=rowData.categoryId;
		row.specification=rowData.specification;
		row.amount=rowData.amount;
		row.country=rowData.country;
		row.addedAt=timestampToString(rowData.addedAt);
		transactions.push(row);
	}
	setupRowsGrid();
}

function setupRowsGrid() {
	var categoriesClone=JSON.parse(JSON.stringify(categories));
	categoriesClone.unshift({name:"",id:0});
	$("#viewGrid").jsGrid({
        height: "90%",
        width: "100%",
        sorting: true,
		data:transactions,
		editing: true,
        deleteConfirm: "Do you really want to delete the client?",
        fields: [
            { name:"id",title: "ID", type: "number",width:10,readOnly:true},
			{ name:"date",title: "Datum", type: "text",width:35},
			{ name:"categoryId",title: "Kategori", type: "select",items:categoriesClone,textField:'name'
				,valueField:'id',width:30,valueType:"string"},
            { name: "specification", title:"Specifikation", type: "text"},
			{ name: "amount", title:"Belopp", type: "number",width:25,editValue:jsGridDecimalEdit},
			{ name: "addedAt", title:"Tillagd", type: "text",width:35},
			{
                type: "control",
                modeSwitchButton: false,
                editButton: false,
				width:15
            }
        ],
		onItemUpdated:transactionEdit
    });
}

function jsGridDecimalEdit() {
	return this.editControl[0].value;
}

function transactionEdit(event) {
	var newItem=event.item;
	var oldItem=event.previousItem;
	var changes={};
	var change=false;
	for (var field in newItem) {
		if (newItem.hasOwnProperty(field)) {
			if (newItem[field]!=oldItem[field]) {
				changes[field]=newItem[field];
				change=true;
			}
		}
	}
	if (change) {
		editTransaction(newItem.id,changes);
	}
}

function editTransaction(id,changes) {
	changes=JSON.stringify(changes);
	$.post("controller.php", {func:"editTransaction",id:id,changes:changes}, addedNewTransactions,"json");
}

function timestampToString(timestamp,time) {
	if (time==null)
		time=true;
	var date = new Date(timestamp*1000);
	var hours = date.getHours();
	var minutes = "0" + date.getMinutes();
	var seconds = "0" + date.getSeconds();
	var year=date.getFullYear();
	var month="0" +(date.getMonth()+1);
	var day="0" +date.getDate();
	var formattedTime = year+'-'+month.substr(-2)+'-'+day.substr(-2);
	if (time)
		formattedTime+=' '+hours + ':' + minutes.substr(-2);
	return (formattedTime);
}
function setupAddPage() {
	$("#parseRowsButton").click(parseRows);
	$("#addNewRowsButton").click(addNewRows);
}

function addNewRows () {
	$.post("controller.php", {func:"addNewTransactions",transactions:JSON.stringify(newGridRows)}, addedNewTransactions
	,"json");
}

function addedNewTransactions() {
	getTransactions();
}

function parseRows() {
	var data=$("#parseRowsInput").val();
	var rows=data.split("\n");
	var numRows=rows.length;
	newGridRows=[];
	for (var i=0; i<numRows; ++i) {
		var cols=rows[i].split("\t");
		var gridRow={};
		gridRow.date=parseDate(cols[0]);
		gridRow.specification=cols[1];
		gridRow.country=cols[3];
		gridRow.amount=parseFloat(cols[4].replace(",","."));
		newGridRows.push(gridRow);
	}
	setupNewRowsGrid(newGridRows);
}

function parseDate(string) {
	if (!yesterdayString) {
		var date=new Date();
		date.setDate(date.getDate()-1);
		yesterdayString=date.getFullYear()+'-'+pad(date.getMonth()+1,2)+'-'+pad(date.getDate(),2);
	}
	if (string=="Igår") {
		return yesterdayString;
	}
	var fields=string.split(".");
	var dateString=fields[2]+'-'+fields[1]+'-'+fields[0];
	return dateString;
}

function setupNewRowsGrid(data) {
	var dataCopy = JSON.parse(JSON.stringify(data));
	var numRows=data.length;
	for (var i=0; i<numRows; ++i) {
		dataCopy[i].amount=data[i].amount.toFixed(2);
	}
	$("#newRowsGrid").jsGrid({
        width: "100%",
		height:"calc(100% - 285px)",
        sorting: true,
		data:dataCopy,
        deleteConfirm: "Do you really want to delete the client?",
        fields: [
            { name:"date",title: "Datum", type: "text"},
			{ name:"country",title: "Land", type: "text"},
            { name: "specification", title:"Specifikation", type: "text"},
			{ name: "amount", title:"Belopp", type: "number"}
        ]
    });
}
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}