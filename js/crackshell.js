/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var yesterdayString;
var newGridRows=[];
var categories;
var transactions;
var tabLoads={0:setupTransactionPage,2:setupCategoriesPage};
$(init);

function init() {
	setupJsGridCustomFields();
	setupMainTabs();
	$.when(getCategories(),getTransactions()).done(dataLoaded);
	setupAddPage();
	parseRows();
}

function dataLoaded() {
	$("#mainTabs").tabs("option","disabled",false);
	mainTabActivate();
}

function setupMainTabs() {
	$("#mainTabs").tabs({
		activate: mainTabActivate,
		disabled:true,
		active:1
	});
}

function mainTabActivate(event,ui) {
	var tabIndex=$("#mainTabs").tabs("option","active");
	if (tabLoads[tabIndex]) {
		tabLoads[tabIndex]();
		delete tabLoads[tabIndex];
	}
}

function getCategories() {
	return $.getJSON("controller.php",{func:"getCategories"},gotCategories);
}
function gotCategories(data) {
	categories=data;
}

function getTransactions() {
	return $.getJSON("controller.php",{func:"getTransactions"},gotTransactions);
}

function gotTransactions(data) {
	transactions=data;
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

function setupTransactionPage() {
	transactionRows=[];
	var numRows=transactions.length;
	for (var i=0; i<numRows; ++i) {
		var rowData=transactions[i];
		var row={};
		row.id=rowData.id;
		row.date=rowData.date;
		row.categoryId=rowData.categoryId;
		row.specification=rowData.specification;
		row.amount=rowData.amount;
		row.country=rowData.country;
		row.addedAt=timestampToString(rowData.addedAt);
		transactionRows.push(row);
	}
	setupRowsGrid(transactionRows);
}

function setupRowsGrid(transactionRows) {
	var categoriesClone=JSON.parse(JSON.stringify(categories));
	categoriesClone.unshift({name:"",id:0});
	$("#viewGrid").jsGrid({
        height: "90%",
        width: "100%",
        sorting: true,
		data:transactionRows,
		editing: true,
        deleteConfirm: "Do you really want to delete the client?",
        fields: [
            { name:"id",title: "ID", type: "number",width:60,readOnly:true},
			{ name:"date",title: "Datum", type: "text",width:35},
			{ name:"categoryId",title: "Kategori", type: "select",items:categoriesClone,textField:'name'
				,valueField:'id',width:30,valueType:"string"},
            { name: "specification", title:"Specifikation", type: "text"},
			{ name: "amount", title:"Belopp", type: "number",width:25,editValue:jsGridDecimalEdit},
			{ name: "addedAt", title:"Tillagd", type: "text",width:45},
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
		gridRow.categoryId="hoho";
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
	var options=[{text:"test"},{text:"foo"},{text:"bar"}];
	$("#newRowsGrid").jsGrid({
        width: "100%",
		height:"calc(100% - 285px)",
        sorting: true,
		data:dataCopy,
        deleteConfirm: "Do you really want to delete the client?",
        fields: [
            { name:"date",title: "Datum", type: "inputRender",width:20},
			{ name:"country",title: "Land", type: "inputRender",width:40},
            { name: "specification", title:"Specifikation", type: "inputRender"},
			{ name: "amount", title:"Belopp", type: "inputRender",inputType:"number",width:15},
			{ name: "categoryId", title:"Kategori", type: "chosenRender",options:options,width:40}
        ]
    });
}
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var MyDateField = function(config) {
    jsGrid.Field.call(this, config);
};
 
MyDateField.prototype = new jsGrid.Field({
 
    css: "date-field",            // redefine general property 'css'
    align: "center",              // redefine general property 'align'
 
    myCustomProperty: "foo",      // custom property
 
    sorter: function(date1, date2) {
        return new Date(date1) - new Date(date2);
    },
 
    itemTemplate: function(value) {
        return new Date(value).toDateString();
    },
 
    insertTemplate: function(value) {
        return this._insertPicker = $("<input>").datepicker({ defaultDate: new Date() });
    },
 
    editTemplate: function(value) {
        return this._editPicker = $("<input>").datepicker().datepicker("setDate", new Date(value));
    },
 
    insertValue: function() {
        return this._insertPicker.datepicker("getDate").toISOString();
    },
 
    editValue: function() {
        return this._editPicker.datepicker("getDate").toISOString();
    }
});

function setupJsGridCustomFields() {
	setupJsGridInputField();
	setupJsGridDateField();
	setupJsGridChosenRenderField();
}
function setupJsGridInputField() {
	jsGrid.fields.inputRender = function(config) {
		jsGrid.Field.call(this, config);
	};
	jsGrid.fields.inputRender.prototype = new jsGrid.Field({
		css: "input-field",            // redefine general property 'css'
		sorter: function(val1,val2) {
			if (this.inputType=="number")
				return val1-val2;
			return jsGrid.sortStrategies.string(val1,val2);
		},
		cellRenderer:function(value,item) {
			var td=document.createElement("TD");
			var input=document.createElement("input");
			td.appendChild(input);
			input.value=value;
			$(input).change(inputFieldOnChange);
			var grid=this._grid;
			return td;
			
			function inputFieldOnChange(event) {
				var fieldName=grid.fields[td.cellIndex].name;
				var dataItem=grid.data[td.parentElement.rowIndex];
				dataItem[fieldName]=input.value;
			}
		}
	});
}
function setupJsGridDateField() {
	jsGrid.fields.date = function(config) {
		jsGrid.Field.call(this, config);
	};

	jsGrid.fields.date.prototype = new jsGrid.Field({

		css: "date-field",            // redefine general property 'css'
		align: "center",              // redefine general property 'align'

		myCustomProperty: "foo",      // custom property

		sorter: function(date1, date2) {
			return new Date(date1) - new Date(date2);
		},

		itemTemplate: function(value) {
			return new Date(value).toDateString();
		},

		insertTemplate: function(value) {
			return this._insertPicker = $("<input>").datepicker({ defaultDate: new Date() });
		},

		editTemplate: function(value) {
			return this._editPicker = $("<input>").datepicker().datepicker("setDate", new Date(value));
		},

		insertValue: function() {
			return this._insertPicker.datepicker("getDate").toISOString();
		},

		editValue: function() {
			return this._editPicker.datepicker("getDate").toISOString();
		}
	});
}
function setupJsGridChosenRenderField() {
	jsGrid.fields.chosenRender = function(config) {
		jsGrid.Field.call(this, config);
	};
	jsGrid.fields.chosenRender.prototype = new jsGrid.Field({
		//css: "input-field",            // redefine general property 'css'
		css:"chosenRenderField",
		cellRenderer:function(value,item) {
			var td=document.createElement("TD");
			var select=document.createElement("SELECT");
			td.appendChild(select);
			var numSelectOptions=this.options.length;
			for (var i=0; i<numSelectOptions; ++i) {
				var option=document.createElement("OPTION");
				var optionData=this.options[i];
				option.text=optionData.text;
				select.add(option);
			}
			setTimeout(function(){$(select).chosen();});//wont be correctly "chosenized" before having been added to DOM
			return td;
			
			function inputFieldOnChange(event) {
				for (var grid,elem=$(input.parentElement); !(grid=elem.data("JSGrid")); elem=elem.parent());
				var fieldName=grid.fields[td.cellIndex].name;
				var dataItem=grid.data[td.parentElement.rowIndex];
				dataItem[fieldName]=input.value;
			}
		}
	});
}