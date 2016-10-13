/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var yesterdayString;
var newTransactions=[];
var categories=[],categoriesById={},categoriesByName={};
var transactions=[];
var transactionMonths={};
var mainTabFromName={},mainTabs=[
		mainTabFromName.transactions={index:0,load:setupTransactionPage,loaded:false},
		mainTabFromName.newTransactions={index:1,load:null,loaded:false},
		mainTabFromName.categories={index:2,load:setupCategoriesPage,loaded:false},
		mainTabFromName.categories={index:3,load:setupReportsPage,loaded:false}
];
var newTransactionsGridFields;
var updateCategoriesOnRefresh;
var initialMainTabIndex=1;
var requests={transactions:{},monthCategoriesSums:{}};
$(init);

function init() {
	requests.categories=fetchCategories();
	setupJsGridCustomFields();
	setupMainTabs();
	fetchTransactions(0,0);
	setupAddPage();
	mainTabActivate();
	//setupNewRowsGrid();
}

function fetchCategories() {
	$.getJSON("controller.php",{func:"getCategories"},gotCategories);
}

function gotCategories(data) {
	categories=data;
	var numCategories=data.length;
	for (var i=0; i<numCategories; ++i) {
		var category=categories[i];
		categoriesById[category.id]=categoriesByName[category.name]=category;
	}
}

function onMonthPickerChoose(date,a,b) {
	var year=date.getFullYear();
	var month=date.getMonth()+1;
	getMonthCategoriesSums(year,month);
}

function getMonthCategoriesSums(year,month) {
	var req,yearMonth=year+'-'+month;
	if (req=requests.monthCategoriesSums[yearMonth]) {
		if (req.responseJSON) {
			plotReport(req.responseJSON);
		}
	} else
		requests.monthCategoriesSums[yearMonth]=
			$.getJSON("controller.php",{func:"getMonthCategoriesSums",year:year,month:month})
			.done(gotMonthCategoriesSums);
}

function gotMonthCategoriesSums(data,_,request) {
	var selectedYearMonth=$("#reportsMonthPicker").MonthPicker("GetSelectedYear")
			+'-'+$("#reportsMonthPicker").MonthPicker("GetSelectedMonth");
	if(request===requests.monthCategoriesSums[selectedYearMonth])
		plotReport(data);
}

function plotReport(categories) {
	var numCategories=categories.length;
	var seriesData=[];
	for (var i=0; i<numCategories; ++i) {
		var category=categories[i];
		var dataItem={name: category.category,y: -parseFloat(category.amount)};
		seriesData.push(dataItem);
	}
	$('#piechartContainer').highcharts({
        chart: {
            type: 'pie'
        },
        title: {
            text: ''
        },
        subtitle: {
            text: ''
        },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    //format: '{point.name}: {point.y:.1f}',
					formatter:function(){
						console.log(this);
						return this.key+": "+this.y.toFixed(2)+":-<br>"+this.percentage.toFixed(2)+"%";
					}
                }
            },
        },

        tooltip: {
            headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
            pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}</b><br/>',
			formatter:function(){return "kjjkjk"}
        },
        series: [{
            name: 'Categories',
            colorByPoint: true,
            data: seriesData,
        }],
        drilldown: {
            series: [{
                name: 'Microsoft Internet Explorer',
                id: 'Microsoft Internet Explorer',
                data: [
                    ['v11.0', 24.13],
                    ['v8.0', 17.2],
                    ['v9.0', 8.11],
                    ['v10.0', 5.33],
                    ['v6.0', 1.06],
                    ['v7.0', 0.5]
                ]
            }, {
                name: 'Chrome',
                id: 'Chrome',
                data: [
                    ['v40.0', 5],
                    ['v41.0', 4.32],
                    ['v42.0', 3.68],
                    ['v39.0', 2.96],
                    ['v36.0', 2.53],
                    ['v43.0', 1.45],
                    ['v31.0', 1.24],
                    ['v35.0', 0.85],
                    ['v38.0', 0.6],
                    ['v32.0', 0.55],
                    ['v37.0', 0.38],
                    ['v33.0', 0.19],
                    ['v34.0', 0.14],
                    ['v30.0', 0.14]
                ]
            }, {
                name: 'Firefox',
                id: 'Firefox',
                data: [
                    ['v35', 2.76],
                    ['v36', 2.32],
                    ['v37', 2.31],
                    ['v34', 1.27],
                    ['v38', 1.02],
                    ['v31', 0.33],
                    ['v33', 0.22],
                    ['v32', 0.15]
                ]
            }, {
                name: 'Safari',
                id: 'Safari',
                data: [
                    ['v8.0', 2.56],
                    ['v7.1', 0.77],
                    ['v5.1', 0.42],
                    ['v5.0', 0.3],
                    ['v6.1', 0.29],
                    ['v7.0', 0.26],
                    ['v6.2', 0.17]
                ]
            }, {
                name: 'Opera',
                id: 'Opera',
                data: [
                    ['v12.x', 0.34],
                    ['v28', 0.24],
                    ['v27', 0.17],
                    ['v29', 0.16]
                ]
            }]
        }
    });//.css("margin","-200 auto");
}

function assignDataTo(object,property) {
	return function(data) {
		object[property]=data;
	}
}

function fetchMonthTransactions(year,month,aboveId) {
	var period=year+'-'+month;
	return $.getJSON("controller.php",{func:"getMonthTransactions",year:year,month:month,aboveId:aboveId||0})
			.done(gotMonthTransactions);
	function gotMonthTransactions(data) {
		transactionMonths[period]=data;
		console.log("got transactions");
	}
}

function setupReportsPage() {
	$("#reportsMonthPicker").MonthPicker({
        OnAfterChooseMonth: onMonthPickerChoose
    }).find(".ui-state-highlight").click();
}

function fetchTransactions(sinceTransactionsId,sinceCategoryId) {
	$.getJSON("controller.php",
	{func:"getTransactions",sinceTransactionId:sinceTransactionsId,sinceCategoryId:sinceCategoryId}
	,gotTransactions);
}

function gotTransactions(data) {
	$("#mainTabs").tabs("option","disabled",false);
	var fetchedCategories=data.categories;
	for (var i=0; i<fetchedCategories.length; ++i) {
		var category=fetchedCategories[i];
		categories.push(categoriesById[category.id]=categoriesByName[category.name]=category);
	}
	transactions=transactions.concat(data.transactions);
	var selectedTabItem=mainTabs[$("#mainTabs").tabs("option","active")];
	var transactionsTabItem=mainTabFromName.transactions;
	if (selectedTabItem===transactionsTabItem) {
		transactionsTabItem.load();
	} else {
		transactionsTabItem.loaded=false;
	}
}

function setupMainTabs() {
	$("#mainTabs").tabs({
		activate: mainTabActivate,
		disabled:true,
		active:initialMainTabIndex
	});
}

function mainTabActivate(event,ui) {
	var tabData=mainTabs[$("#mainTabs").tabs("option","active")];
	if (!tabData.loaded) {
		if (tabData.load)
			tabData.load();
		tabData.loaded=true;
	}
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
		noDataContent:null,
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
					var category=categoriesByName[newItem[field]];
					if (category)
						changes.categoryId=category.id;
					else
						changes.categoryName=newItem[field];
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
	$.post("controller.php", {func:"editTransaction",id:id,changes:changes}, transactionEdited,"json");
}

function transactionEdited(data) {
	if (data.newCategory) {
		categories.push(categoriesById[data.newCategory.id]=categoriesByName[data.newCategory.name]=data.newCategory);
		setupRowsGrid();
	}
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
	console.log(transactions.length);
	var transactionsData=[];
	var newCategories=[];
	for (var i=newTransactions.length-1; i>=0; --i) {
		var transaction=newTransactions[i];
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
	newTransactions=[];
	setupNewRowsGrid();
}

function transactionsAdded() {
	fetchTransactions(transactions.length?transactions[transactions.length-1].id:0
	,categories.length?categories[categories.length-1].id:0);
}

function normalizeDateString(string) {
	var match=/^(?:(\d\d[.-]\d\d[.-]\d\d\d\d)|(\d\d\d\d[.-]\d\d[.-]\d\d))$/.exec(string);
	if (match) {
		var result=string.replace('.','-');
		if (match[1]) {
			result=result.split('-').reverse().join('-')
		}
		return result;
	}
	return false;
}

function matchesAmountField(string) {
	return !!string.match(/\d+[,.]\d\d/);
}

function rowStringToCells(rowString) {
	return rowString.split(/[ \t]*\t[ \t]*/);
}

function guessColumns(rows) {
	var row=rows[0];
	var numCells=row.length;
	var colGuesses=[];
	var dateCol,specCol,amountCol;
	for (var x=0;x<numCells;++x) {
		var cell=row[x];
		if (normalizeDateString(cell)) {
			if (dateCol>=0)
				colGuesses[dateCol]=null;
			colGuesses[x]="date";
			dateCol=x;
		} else if (matchesAmountField(cell)){
			if (amountCol===undefined) {
				amountCol=x;
				colGuesses[x]='amount';
			} else
				colGuesses[x]=null;
		} else {
			if (specCol===undefined) {
				colGuesses[x]='specification';
				specCol=x;
			} else
				colGuesses[x]=null;
		}
	}
	return colGuesses;
}

function parseRows() {
	var data=$("#parseRowsInput").val();
	var rows=data.split("\n");
	for (var y=0; y<rows.length; ++y) {
		if (!rows[y].length) {//remove empty row
			rows.splice(y--,1);
		} else
			rows[y]=rowStringToCells(rows[y]);
	}
	var colGuesses=guessColumns(rows);
	var numCells=colGuesses.length;
	newTransactions=[];
	var fieldName,fieldNames=[];
	var unknownNum=0;
	for (var x=0; x<numCells; ++x) {
		var fieldName=colGuesses[x];
		if (!fieldName)
			fieldName="unknown"+(unknownNum++);
		fieldNames[x]=fieldName;
	}
	for (var y=0; y<rows.length; ++y) {
		row=rows[y];
		var transaction={};
		for (var x=0; x<numCells; ++x) {
			transaction[fieldNames[x]]=row[x];
		}
		newTransactions.push(transaction);
	}
	setupNewRowsGrid(fieldNames);
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
			if (guessForTransaction===otherTransaction||guessForTransaction.manuallyCategorized)
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
		item.manuallyCategorized=true;
		delete item.suggestedCategory;
		var transactionsAlikeThis=transactionCompare(item,newTransactions);
		for (var i=transactionsAlikeThis.length-1; i>=0; --i) {
			transactionsAlikeThis[i].suggestedCategory=item.category;
			suggestCategoryForNewTransaction(transactionsAlikeThis[i]);
		}
	}
}

function suggestCategoryForNewTransaction(transaction) {
	if (transaction.suggestedCategory) {
		for (var fieldI=0; newTransactionsGridFields[fieldI].name!=="category"; ++fieldI);
		var rowI=newTransactions.indexOf(transaction);
		var td$=$("#newRowsGrid>.jsgrid-grid-body tr:nth-child("+(rowI+1)+")>td:nth-child("+(fieldI+1)+")");
		if (transaction.viewed) {
			td$.find(">button").remove();
			var button=document.createElement("BUTTON");
			button.innerHTML=transaction.suggestedCategory;
			td$[0].appendChild(button);
			$(button).click(followSuggestion);
		} else {
			followSuggestion();
		}
		function followSuggestion() {
			button&&$(button).remove();
			td$.find("select").val(transaction.category=transaction.suggestedCategory).trigger("chosen:updated");
			newTransactionsCategoryChange(transaction);
		}
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

function setupNewRowsGrid(fieldNames) {
	for (var i=newTransactions.length-1; i>=0; --i) {
		var bestMatch=transactionCompare(newTransactions[i],transactions);
		if (bestMatch) {
			newTransactions[i].category=bestMatch.category;
		}
	}

	var categoryNames=["<Create New>","-"];
	for (var i=0; i<categories.length; ++i) {
		categoryNames.push(categories[i].name);
	}
	var fieldTemplates={
		date:{ name:"date",title: "Datum", type: "inputRender",width:30},
		country:{ name:"country",title: "Land", type: "inputRender",width:40},
		specification:{ name: "specification", title:"Specifikation", type: "inputRender"},
		amount:{ name: "amount", title:"Belopp", type: "inputRender",inputType:"number",width:30},
		category:{ name: "category", title:"Kategori", type: "chosenView",options:categoryNames,width:40
			,changeCallback:newTransactionsCategoryChange},
		control:{type:"control", editButton:false, width:10}
	};
	newTransactionsGridFields=[];
	for (var i=0; i<fieldNames.length; ++i) {
		var template=fieldTemplates[fieldNames[i]];
		if (template)
			newTransactionsGridFields.push(template);
		else
			newTransactionsGridFields.push({name:fieldNames[i],title:"Unknown"});
	}
	newTransactionsGridFields.push(fieldTemplates.category);
	$("#newRowsGrid").jsGrid({
        width: "100%",
		height:"calc(100% - 285px)",
        sorting: true,
		data:newTransactions,
        deleteConfirm: "Do you really want to delete the client?",
        fields: newTransactionsGridFields,
		noDataContent:null,
		confirmDeleting: false,
		inserting: true,
		onRefreshed:newTransactionsGridRefresh
    }).find(".jsgrid-insert-mode-button").click().remove();
}

function newTransactionsGridRefresh() {
	for (var i=newTransactions.length-1; i>=0; --i) {
		suggestCategoryForNewTransaction(newTransactions[i]);
	}
	if (newTransactions.length)
		updateNewTransactionsViewedStatuses();
	//$("#newRowsGrid>.jsgrid-grid-body").scroll(function(){console.log(1)});
}

function updateNewTransactionsViewedStatuses() {
	var newRowsGridBody=$("#newRowsGrid>.jsgrid-grid-body").scroll(newTransactionsGridScroll)[0];
	var scrollTop=newRowsGridBody.scrollTop;
	var containerHeight=newRowsGridBody.offsetHeight;
	var newGridRows=$(newRowsGridBody).find("tr");
	var numRows=newGridRows.length;
	var viewedEdgeIndices={};
	for (var i=0; i<numRows; ++i) {
		var row=newGridRows[i];
		var rowTop=row.offsetTop;
		var rowBottom=rowTop+row.offsetHeight;
		var inside=rowBottom>scrollTop&&rowTop<scrollTop+containerHeight;
		if (inside) {
			if (!viewedEdgeIndices[-1])
				viewedEdgeIndices[-1]=i;
			else
				viewedEdgeIndices[1]=i;
			newTransactions[i].viewed=true;
		}
	}
	function newTransactionsGridScroll() {
		var signum=newRowsGridBody.scrollTop>scrollTop?1:-1;
		var i=viewedEdgeIndices[signum];
		scrollTop=newRowsGridBody.scrollTop;
		while (i>0&&i<numRows-1) {
			i+=signum;
			var row=newGridRows[i];
			var rowTop=row.offsetTop;
			var rowBottom=rowTop+row.offsetHeight;
			var inside=rowBottom>scrollTop&&rowTop<scrollTop+containerHeight;
			if (inside) {
				newTransactions[i].viewed=true;
				viewedEdgeIndices[signum]=i;
			} else
				break;
		}
	}
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
				$(select).chosen({has_create_option:true}).change(onChange)
				.next().css("width","100%");
			}
			
			
			function onChange(event,select) {
				var selected=select.selected;
				item[fieldName]=(selected=='-'?null:selected);
				var cellIndex=td.cellIndex;
				if (selected) {
					var columnOptions=grid.fields[cellIndex].options;
					if (columnOptions.indexOf(selected)===-1) {
						createOption();
					}
				}
				changeCallback&&changeCallback(item,selected);
				function createOption() {
					columnOptions.push(selected);
					var rowIndex=td.parentElement.rowIndex;
					var rows=td.parentElement.parentElement.rows;
					var numRows=rows.length;
					for (var i=0; i<numRows; ++i) {
						if (i!==rowIndex) {
							var otherSelect=rows[i].cells[cellIndex].firstChild;
							var option=document.createElement("OPTION");
							option.text=selected;
							otherSelect.add(option);
							$(otherSelect).trigger("chosen:updated");
						}
					}
					createOptionCallback&&createOptionCallback(item,selected);
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
				if (value==null)
					value="-";
				select.value=value;
			}
			setTimeout(chosenize);//wont be correctly "chosenized" before having been added to DOM
			return select;
			
			function chosenize() {
				$(select).chosen({
					has_create_option:true,on_create_option:null
					//no_results_text:offerToCreateOption
					})
				.next().css("width","100%");
			}
			function offerToCreateOption(searchString) {
				var createButton=document.createElement("button");
				createButton.innerHTML='Create "'+searchString+'"';
				$(createButton).click(createOption);
				return createButton;
				function createOption() {
					var option=document.createElement("OPTION");
					option.text=searchString;
					$(select).append(option).val(searchString).trigger("chosen:updated");
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