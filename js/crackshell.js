/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var yesterdayString;
var newGridRows=[];
var categories;
var categoriesById,categoriesByName;
var transactions;
var tabLoads={0:setupTransactionPage,2:setupCategoriesPage};
var newTransactionsGridFields;
var updateCategoriesOnRefresh;
var initilMainTabIndex=0;
$(init);

function init() {
	setupJsGridCustomFields();
	setupMainTabs();
	$.when(getCategories(),getTransactions()).done(dataLoaded);
	setupAddPage();
}

function dataLoaded() {
	$("#mainTabs").tabs("option","disabled",false);
	categoriesById={};
	categoriesByName={};
	for (var i=categories.length-1; i>=0; --i) {
		categoriesById[categories[i].id]=categoriesByName[categories[i].name]=categories[i];
		
	}
	for (var i=transactions.length-1; i>=0; --i) {
		var transaction=transactions[i];
		if (transaction.categoryId) {
			transaction.category=categoriesById[transaction.categoryId].name;
		}
		delete transaction.categoryId;
	}
	setupNewRowsGrid();
	mainTabActivate();
}

function setupMainTabs() {
	$("#mainTabs").tabs({
		activate: mainTabActivate,
		disabled:true,
		active:initilMainTabIndex
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
	setupRowsGrid(transactions);
	return;
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
	var categoryNames=["-"];
	for (var i=0; i<categories.length; ++i) {
		categoryNames.push(categories[i].name);
	}
	$("#viewGrid").jsGrid({
        height: "90%",
        width: "100%",
        sorting: true,
		data:transactionRows,
		editing: true,
        deleteConfirm: "Do you really want to delete the client?",
        fields: [
            { name:"id",title: "ID", type: "number",width:10,readOnly:true},
			{ name:"date",title: "Datum", type: "text",width:35},
			{ name:"category",title: "Kategori", type: "chosen",options:categoryNames,textField:'name'
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
			if (newItem[field]!==oldItem[field]) {
				if (field==="category") {
					changes.categoryId=categoriesByName[newItem[field]].id;
				} else {
					changes[field]=newItem[field];
				}
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
	$.post("controller.php", {func:"editTransaction",id:id,changes:changes}, null,"json");
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
	var transactionsData=[];
	var newCategories=[];
	for (var i=newGridRows.length-1; i>=0; --i) {
		var transaction=newGridRows[i];
		var transactionData={specification:transaction.specification,amount:transaction.amount
			,country:transaction.country,date:transaction.date};
		if (transaction.category) {
			var category=categoriesByName[transaction.category];
			if (category) {
				transactionData.categoryId=category.id;
			} else {
				transactionData.categoryName=transaction.category;
				if (-1===newCategories.indexOf(transaction.category))
					newCategories.push(transaction.category);
			}
		}
		transactionsData.push(transactionData);
	}
	$.post("controller.php", {func:"addNewTransactions",transactions:JSON.stringify(transactionsData)
		,newCategories:JSON.stringify(newCategories)},transactionsAdded,"json");
	newGridRows=[];
	setupNewRowsGrid();
}

function transactionsAdded(data) {
	
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
	setupNewRowsGrid();
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

/**Compares a single transaction to an array of transactions to guess categor(y|ies).
 * - If the single transaction lacks a category then it is the transaction that a category will be guessed for by
 * comparing it with the array of transactions. The function will then return the transaction from the array that is the
 * best match while not lacking a category.
 * - If the single transaction already has a category then categories will be guessed for the ones in the array by
 * comparing them to the single transaction. In this case an array of the transactions that got a better match with the
 * single transaction than what they had before will be returned.
 * @param {type} transaction
 * @param {type} transactions
 * @returns {undefined}*/
function transactionCompare(transaction,transactions) {
	var result;
	var guessForTheSingle=!transaction.category;
	var guessForTransaction,otherTransaction;
	if (guessForTheSingle)
		guessForTransaction=transaction;
	else {
		otherTransaction=transaction;
		result=[];
	}
	for (var i=transactions.length-1; i>=0; --i) {
		if (guessForTheSingle) {
			otherTransaction=transactions[i];
			if (!otherTransaction.category)
				continue;
		} else {
			guessForTransaction=transactions[i];
			if (guessForTransaction===otherTransaction)
				continue;
		}
		var similarity=transactionStringMatch(guessForTransaction.specification,otherTransaction.specification);
		if (similarity>.4&&(!guessForTransaction.highestSimilarity||similarity>guessForTransaction.highestSimilarity)) {
			guessForTransaction.highestSimilarity=similarity;
			if (guessForTheSingle)
				result=otherTransaction;
			else
				result.push(guessForTransaction);
		}
	}
	return result;
}

function newTransactionsCategoryChange(item) {
	if (item.category) {//don't do anything if category was set to null
		var transactionsAlikeThis=transactionCompare(item,newGridRows);
		for (var i=transactionsAlikeThis.length-1; i>=0; --i) {
			suggestCategoryForNewTransaction(item.category,transactionsAlikeThis[i]);
		}
	}
}

function suggestCategoryForNewTransaction(category,transaction) {
	for (var fieldI=0; newTransactionsGridFields[fieldI].name!=="category"; ++fieldI);
	var rowI=newGridRows.indexOf(transaction);
	var td=$("#newRowsGrid>.jsgrid-grid-body tr:nth-child("+(rowI+1)+")>td:nth-child("+(fieldI+1)+")")[0];
	var button=document.createElement("BUTTON");
	button.innerHTML=category;
	td.appendChild(button);
	$(button).click(followSuggestion);
	function followSuggestion() {
		$(button).remove();
		$(td).find("select").val(category).trigger("chosen:updated");
		transaction.category=category;
	}
}

function similar_text (first, second) {
    // Calculates the similarity between two strings  
    // discuss at: http://phpjs.org/functions/similar_text

    if (first === null || second === null || typeof first === 'undefined' || typeof second === 'undefined') {
        return 0;
    }

    first += '';
    second += '';

    var pos1 = 0,
        pos2 = 0,
        max = 0,
        firstLength = first.length,
        secondLength = second.length,
        p, q, l, sum;

    max = 0;

    for (p = 0; p < firstLength; p++) {
        for (q = 0; q < secondLength; q++) {
            for (l = 0;
            (p + l < firstLength) && (q + l < secondLength) && (first.charAt(p + l) === second.charAt(q + l)); l++);
            if (l > max) {
                max = l;
                pos1 = p;
                pos2 = q;
            }
        }
    }

    sum = max;

    if (sum) {
        if (pos1 && pos2) {
            sum += this.similar_text(first.substr(0, pos2), second.substr(0, pos2));
        }

        if ((pos1 + max < firstLength) && (pos2 + max < secondLength)) {
            sum += this.similar_text(first.substr(pos1 + max, firstLength - pos1 - max), second.substr(pos2 + max, secondLength - pos2 - max));
        }
    }

    return sum;
}

function setupNewRowsGrid() {
	for (var i=newGridRows.length-1; i>=0; --i) {
		var bestMatch=transactionCompare(newGridRows[i],transactions);
		if (bestMatch) {
			newGridRows[i].category=bestMatch.category;
		}
	}

	var categoryNames=["-"];
	for (var i=0; i<categories.length; ++i) {
		categoryNames.push(categories[i].name);
	}
	newTransactionsGridFields=[
		{ name:"date",title: "Datum", type: "inputRender",width:25},
		{ name:"country",title: "Land", type: "inputRender",width:40},
		{ name: "specification", title:"Specifikation", type: "inputRender"},
		{ name: "amount", title:"Belopp", type: "inputRender",inputType:"number",width:30},
		{ name: "category", title:"Kategori", type: "chosenView",options:categoryNames,width:40
			,changeCallback:newTransactionsCategoryChange},
		{type:"control", editButton:false, width:10}
	];
	$("#newRowsGrid").jsGrid({
        width: "100%",
		height:"calc(100% - 285px)",
        sorting: true,
		data:newGridRows,
        deleteConfirm: "Do you really want to delete the client?",
        fields: newTransactionsGridFields,
		noDataContent:null,
		confirmDeleting: false,
		inserting: true,
    }).find(".jsgrid-insert-mode-button").click().remove();
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
	setupJsGridChosenField();
	setupJsGridChosenViewField();
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

/**Puts a select element in the direct view of the cell, so it can be changed instantly. 
 * It is not a plain select but a "js chosen" element. The source of it is also changed a bit in order ot make it
 * possibly to supply a function instead of only text for no_results_text. This makes it possible to introduce the
 * create-button when an item isn't found.
 * @returns {undefined}
 */
function setupJsGridChosenViewField() {
	jsGrid.fields.chosenView = function(config) {
		jsGrid.Field.call(this, config);
	};
	jsGrid.fields.chosenView.prototype = new jsGrid.Field({
		//css: "input-field",            // redefine general property 'css'
		css:"chosenViewField",
		cellRenderer:function(value,item) {
			var fieldName=this.name;
			var grid=this._grid;
			var createOptionCallback=this.createOptionCallback;
			var changeCallback=this.changeCallback;
			var options=this.options;

			var createOptionFunc=this.createOptionFunc;
			var td=document.createElement("TD");
			var select=document.createElement("SELECT");
			td.appendChild(select);
			var numSelectOptions=options.length;
			for (var i=0; i<numSelectOptions; ++i) {
				var option=document.createElement("OPTION");
				option.text=options[i];
				select.add(option);
			}
			select.value=value?value:'-';
			setTimeout(chosenize);//wont be correctly "chosenized" before having been added to DOM
			return td;
			
			function chosenize() {
				$(select).chosen({no_results_text:offerToCreateOption}).change(onChange)
				.next().css("width","100%");
			}
			
			function onChange(event,select) {
				item[fieldName]=select.selected=='-'?null:select.selected;
				changeCallback&&changeCallback(item);
			}
			function offerToCreateOption(searchString) {
				var createButton=document.createElement("button");
				createButton.innerHTML='Create "'+searchString+'"';
				$(createButton).click(createOption);
				return createButton;
				function createOption() {
					item[fieldName]=searchString;
					var cellIndex=td.cellIndex;
					var rowIndex=td.parentElement.rowIndex;
					grid.fields[cellIndex].options.push({name:searchString});
					var rows=td.parentElement.parentElement.rows;
					var numRows=rows.length;
					for (var i=0; i<numRows; ++i) {
						var otherSelect=rows[i].cells[cellIndex].firstChild;
						var option=document.createElement("OPTION");
						option.text=searchString;
						otherSelect.add(option);
						if (i==rowIndex) {
							select.value=searchString;
						}
						$(otherSelect).trigger("chosen:updated");
						createOptionCallback&&createOptionCallback();
						changeCallback&&changeCallback(item);
					}
				}
			}
		}
	});
}
function setupJsGridChosenField() {
	jsGrid.fields.chosen = function(config) {
		jsGrid.Field.call(this, config);
	};
	jsGrid.fields.chosen.prototype = new jsGrid.Field({
		editTemplate: function(value) {
			var select=document.createElement("SELECT");
			this.editSelect=select;
			var numSelectOptions=this.options.length;
			for (var i=0; i<numSelectOptions; ++i) {
				var option=document.createElement("OPTION");
				option.text=this.options[i];
				select.add(option);
				select.value=value;
			}
			setTimeout(chosenize);//wont be correctly "chosenized" before having been added to DOM
			return select;
			
			function chosenize() {
				$(select).chosen({no_results_text:offerToCreateOption})
				.next().css("width","100%");
			}
			function offerToCreateOption(searchString) {
				var createButton=document.createElement("button");
				createButton.innerHTML='Create "'+searchString+'"';
				$(createButton).click(createOption);
				return createButton;
				function createOption() {
					item[fieldName]=searchString;
					var cellIndex=td.cellIndex;
					var rowIndex=td.parentElement.rowIndex;
					grid.fields[cellIndex].options.push({name:searchString});
					var rows=td.parentElement.parentElement.rows;
					var numRows=rows.length;
					for (var i=0; i<numRows; ++i) {
						var otherSelect=rows[i].cells[cellIndex].firstChild;
						var option=document.createElement("OPTION");
						option.text=searchString;
						otherSelect.add(option);
						if (i==rowIndex) {
							select.value=searchString;
						}
						$(otherSelect).trigger("chosen:updated");
						createOptionCallback&&createOptionCallback();
						changeCallback&&changeCallback(item);
					}
				}
			}
		},
		editValue:function() {
			return this.editSelect.value;
		}
	});
}
function transactionStringMatch(string1,string2) {
	if (string1===string2)
		return 1;
    var shortestLength=Math.min(string1.length,string2.length);
	for (var i=0; i<shortestLength&&string1[i]===string2[i]; ++i);
	return i/shortestLength;
}