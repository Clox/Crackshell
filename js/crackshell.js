/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var yesterdayString;
var newTransactions=[];
var categories,categoriesByName={},categoriesById={};
var accounts,accountsByName={},accountsById={};
var transactions=[];
var transactionMonths={};
var mainTabFromName={},mainTabs=[
		mainTabFromName.transactions={index:0,load:setupTransactionPage,loaded:false},
		mainTabFromName.import={index:1,load:setupImportTab,loaded:false},
		mainTabFromName.categories={index:2,load:setupCategoriesPage,loaded:false},
		mainTabFromName.reports={index:3,load:setupReportsPage,loaded:false}
];
var newTransactionsGridFields;
var updateCategoriesOnRefresh;
var initialMainTabIndex=0;
var activeImportTranactionsPage;
var colAssignments;//Used when assigning columns in imported data to transaction-fields
$(init);

var monthNameFromNumber=['','Januari','Februari','Mars','April','Maj'
	,'Juni','Juli','Augusti','September','Oktober','November','December'];

function init() {
	setupJsGridCustomFields();
	setupMainTabs();
	//fetchTransactions(0,0);
	fetchBaseData().done(gotBaseData);
	//setupNewRowsGrid();
}

function gotBaseData() {
	$("#mainTabs").tabs("option","disabled",false);
	mainTabActivate();
	var numCategories=categories.length;
	for (var i=0; i<numCategories; ++i) {
		var category=categories[i];
		categoriesByName[category.name]=categoriesById[category.id]=category;
	}
	var numAccounts=accounts.length;
	for (var i=0; i<numAccounts; ++i) {
		var account=accounts[i];
		accountsByName[account.name]=accountsById[account.id]=account;
	}
}

function setupImportTab() {
	$("#importTransactionsPages>.firstPage>button.textParsing").click(textParsingButtonClick);
	$("#importCsvButton").click(csvParsingButtonClick);
	setActiveImportPage("firstPage");
	$("#parseRowsButton").click(parseRows);
	$("#importTransactionsPages .importTransactionsContinueToCategorizeButton")
			.click(importTransactionsContinueToCategorize);
	$("#importTransactionsCommitButton").click(importTransactionsCommit);
	
	$("#importTransactionsCsvFileInput").change(importTransactionsCsvFileInputChange);
}

function importTransactionsCsvFileInputChange() {
	var reader = new FileReader();
	reader.onload=importTransactionsCsvFileLoaded;
	reader.readAsText(this.files[0],'ISO-8859-1');
}

function importTransactionsCsvFileLoaded() {
	var csvContent=this.result;
	newTransactions=[];
	var rows=csvContent.split("\r\n");
	var numRows=rows.length;
	for (var y=0; y<numRows; ++y) {
		var cells=rows[y].split(';');
		for (var x=0; x<cells.length; ++x) {
			cells[x]=cells[x].slice(1,-1);
		}
		if (cells.length>1) {
			newTransactions.push(cells);
		}
	}
	handleParsedTransactions();
}

function setupAccountSelect(target) {
	var select=$(target)[0];
	var option=document.createElement("OPTION");
	option.innerHTML="-";
	select.add(option);
	for (var i=0; i<accounts.length; ++i) {
		option=document.createElement("OPTION");
		var account=accounts[i];
		option.value=account.id;
		option.innerHTML=account.name;
		select.add(option);
	}
	$(target).chosen({has_create_option:true});
}

function setActiveImportPage(pageName) {
	if (activeImportTranactionsPage)
		$("#importTransactionsPages").find(">."+activeImportTranactionsPage).css("display","none")
	$("#importTransactionsPages").find(">."+pageName).css("display","block")
	.find(" .bottomButtons>.cancel").click(cancelImportClick);
	activeImportTranactionsPage=pageName;
}

function importTransactionsContinueToCategorize() {
	var transaction,i=0;
	while (transaction=newTransactions[i++]) {
		for (var colAssignmentIndex=colAssignments.length-1; colAssignmentIndex>=0; --colAssignmentIndex) {
			var colAssignment=colAssignments[colAssignmentIndex];
			if (colAssignment) {
				var value=transaction[colAssignmentIndex];
				if (colAssignment==='date')
					value=normalizeDateString(value);
				else if(colAssignment==='amount')
					value=normalizeNumberString(value);
				transaction[colAssignment]=value;
			}
			delete transaction[colAssignmentIndex];
		}
	}
	setActiveImportPage("categorize");
	setupAccountSelect($("#importTransactionsAccountSelect"));
	setupImportTransactionsCategorizeGrid();
}

function cancelImportClick() {
	setActiveImportPage("firstPage");
}

function textParsingButtonClick() {
	setActiveImportPage("textParsing");
}

function csvParsingButtonClick() {
	setActiveImportPage("csvParsing");
}

function onMonthPickerChoose(date,a,b) {
	var year=date.getFullYear();
	var month=date.getMonth()+1;
	getMonthCategoriesSums(year,month);
}

function getMonthCategoriesSums(year,month) {
	var numTransactions=transactions.length;
	var expenses={};
	var income={};
	var expensesSum=0;
	var entriesToProcess=[];
	for (var i=0; i<numTransactions; ++i) {
		var transaction=transactions[i];
		var date=transaction.date.split('-');
		if (date[0]==year&&date[1]==month&&transaction.amount<0) {
			entriesToProcess.push({name:'transaction'+i,parent:transaction.category,sum:transaction.amount});
			expensesSum+=transaction.amount;
		}
	}
	while (entriesToProcess.length) {
		for (var i=entriesToProcess.length-1; i>=0; --i) {
			var entry=entriesToProcess[i];
			delete expenses[entry.name];
			var parentName=entry.parent;
			var parentEntry=expenses[parentName];
			if (!parentEntry) {
				if (parentName)
					parentEntry=categoriesByName[parentName];
				else
					parentEntry={};
				expenses[parentName]=parentEntry;
				parentEntry.sum=0;
				parentEntry.children=[];
				if (parentEntry.parent) {
					entriesToProcess.push(parentEntry);
				}
			}
			parentEntry.sum+=entry.sum;
			parentEntry.children.push(entry);
			entriesToProcess.splice(i,1);
		}
	}
	highChartPlotReport(expenses,expensesSum,income,year,month);
}

function highchartGenerateData(entries,seriesData,drilldownSeries) {
	for (var entryKey in entries) {
		if (entries.hasOwnProperty(entryKey)) {
			var entry=entries[entryKey];
			var seriesDataItem={name: entry.name,y: -entry.sum};
			if (entry.children) {
				seriesDataItem.drilldown=entry.name;
				var newDrilldown={data:[],id:entry.name};
				drilldownSeries.push(newDrilldown);
				highchartGenerateData(entry.children,newDrilldown.data,drilldownSeries);
			}
			seriesData.push(seriesDataItem);
		}
	}
}

function highChartPlotReport(expenses,expensesSum,income,year,month) {
	var series=[{data:[], name: 'Things',colorByPoint: true}];
	var drilldown={series:[]};
	highchartGenerateData(expenses,series[0].data,drilldown.series);
	var highChartData={
		series:series,
		drilldown:drilldown,
        chart: {
            type: 'pie'
        },
        title: {
            text: 'Expenses - '+monthNameFromNumber[month]+' '+year
        },
        subtitle: {
            text: 'Total: '+-expensesSum.toFixed(2)+':-'
        },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '{point.name}: {point.y:.2f}:-',
					//formatter:function(){return this.key+": "+this.y.toFixed(2)+":-";}
                }
            },
        },
        tooltip: {
            headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
            pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}</b><br/>',
			format: '{point.name}: {point.y:.2f}:-',
			formatter:function(highChart){
				return '<span style="color:'+this.color+'">'+this.key+'</span>: <b>'+this.y.toFixed(2)+':-</b>'
				+'<br><b>'+this.percentage.toFixed(2)+'%</b>';
			}
        }
    };
	$('#piechartContainer').highcharts(highChartData);
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
	}
}

function setupReportsPage() {
	$("#reportsMonthPicker").MonthPicker({
        OnAfterChooseMonth: onMonthPickerChoose
    }).find(".ui-state-highlight").click();
}
function fetchBaseData() {
	return $.when(fetchCategories(),fetchAccounts());
}

function fetchCategories() {
	return $.getJSON("controller.php",{func:"getCategories"},assignDataTo(window,"categories"));
}

function fetchAccounts() {
	return $.getJSON("controller.php",{func:"getAccounts"},assignDataTo(window,"accounts"));
}

function fetchTransactions() {
	return $.getJSON("controller.php",{func:"getTransactions"},assignDataTo(window,"transactions"));
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
	categoryNames=["<Create New>","-"];
	for (var i=0; i<categories.length; ++i) {
		categoryNames.push(categories[i].name);
	}
	$("#categoriesGrid").jsGrid({
        width: "100%",
        sorting: true,
		data:categories,
        deleteConfirm: "Do you really want to delete the client?",
		inserting: true,
        editing: true,
		noDataContent:null,
        fields: [
            { name:"id",title: "ID", type: "number",readOnly:true,visible:false},
			{ name:"name",title: "Namn", type: "text"},
            { name: "parent", title:"Parent", type: "chosen",options:categoryNames},
			{
                type: "control",
                modeSwitchButton: false,
                editButton: false,
				deleteButton:false
            }
        ],
		onItemUpdated:categoryEdited,
		onItemInserted:categoryInserted,
		onItemDeleted:categoryDeleted
    });
}

function categoryEdited(data) {
	var item=data.item;
	var prevItem=data.previousItem;
	var changes=findChanges(item,prevItem);
	if (changes) {
		if (item.parent&&!categoriesByName[item.parent]) {
			categoryCreatedLocal({name:item.parent});
		} 
		$.post("controller.php",
		{func:"editCategory",refName:prevItem.name,name:item.name,parent:item.parent},null,"json");
	}
}

function findChanges(a,b) {
	var changed=false,changes={};
	for (prop in a) {
		if (a.hasOwnProperty(prop)) {
			if (a[prop]!=b[prop]) {
				changed=true;
				changes[prop]=b[prop];
			}
		}
	}
	return changed?changes:false;
}

function categoryDeleted(event) {
	var categoryId=event.item.id;
	var promise=$.post("controller.php", {func:"deleteCategory",id:categoryId},null,"json");
}

function categoryCreatedLocal(item) {
	categoriesByName[item.name]=item;
	categoryNames.push(item.name);
	console.log("createdlocalcategory");
	$("#categoriesGrid").jsGrid('fieldOption','parent', 'options', categoryNames);
}

function categoryInserted(event) {
	var name=event.item.name;
	var promise=$.post("controller.php", {func:"createCategory",name:name},categoryCreated,"json");
	promise.customData={item:event.item};
	promise.done=setupTransactionsGrid;
	categoryCreatedLocal({name:event.item.parent});
	
	function categoryCreated(data,message,promise) {
		$("#categoriesGrid").jsGrid("updateItem", promise.customData.item,{ id: data.id});
		setupTransactionsGrid();
	}
}

function setupTransactionPage() {
	fetchTransactions().done(gotTransactions);
}

function gotTransactions() {
	for (var i=transactions.length-1; i>=0; --i) {
		var category=categoriesById[transactions[i].categoryId];
		if (category) {
			transactions[i].category=category.name;
			delete transactions[i].categoryId;
		}
	}
	for (var i=transactions.length-1; i>=0; --i) {
		var account=accountsById[transactions[i].accountId];
		if (account) {
			transactions[i].accountName=account.name;
			delete transactions[i].accountId;
		}
	}
	//setupTransactionsGrid(transactions);
	$("#mainTabs").tabs("option","active",3);
}

function setupTransactionsGrid(transactionRows) {
	var categoryOptions=["<Create New>","-"];
	for (var i=0; i<categories.length; ++i) {
		categoryOptions.push(categories[i].name);
	}
	var accountNames=["-"];
	for (var i=0; i<accounts.length; ++i) {
		accountNames.push(accounts[i].name);
	}
	$("#viewGrid").jsGrid({
        height: "90%",
        width: "100%",
        sorting: true,
		data:transactionRows,
		editing: true,
        deleteConfirm: "Delete this transaction?",
		onItemDeleting:transactionsGridDeleteItem,
		noDataContent:null,
        fields: [
            { name:"id",title: "ID", type: "number",width:10,readOnly:true},
			{ name:"date",title: "Datum", type: "text",width:35},
			{ name:"category",title: "Kategori", type: "chosen",options:categoryOptions
				,width:30,valueType:"string"},
            { name: "specification", title:"Specifikation", type: "text"},
			{ name: "amount", title:"Belopp", type: "number",width:25,editValue:jsGridDecimalEdit},
			{name:"accountName",title:"Konto",type:"chosen",options:accountNames,width:30},
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

function transactionsGridDeleteItem(args) {
	return $.post("controller.php", {func:"deleteTransaction",transactionId:args.item.id}, null,"json");	
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
				if (field==="category") {
					var category=categoriesByName[newItem[field]];
					if (category)
						changes.categoryId=category.id;
					else
						changes.categoryName=newItem[field];
				} else if (field==="account") {
					var account=accountsByName[newItem[field]];
					if (account)
						changes.accountId=account.id;
					else
						changes.accountName=newItem[field];
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
	if (data.newCategory)
		categories.push(categoriesByName[data.newCategory.name]=categoriesById[data.newCategory.id]=data.newCategory);
	if (data.newAccount)
		accounts.push(accountsByName[data.newAccount.name]=accountsById[data.newAccount.id]=data.newAccount);
	setupTransactionsGrid();
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

function importTransactionsCommit () {
	var account=$("#importTransactionsAccountSelect")[0].selectedOptions[0].innerHTML;
	if (account==="-")
		account=null;
	if (account||confirm("Are you sure you want to commit these transactions without an account set?")) {
		var transactionsData=[];
		var newCategories=[];
		for (var i=newTransactions.length-1; i>=0; --i) {
			var transaction=newTransactions[i];
			var transactionData={specification:transaction.specification,amount:transaction.amount
				,location:transaction.location||null,date:transaction.date,type:transaction.type||null};
			if (transaction.category) {
				var category=categoriesByName[transaction.category];
				if (category) {
					transactionData.categoryId=category.id;
				} else {
					if (-1===newCategories.indexOf(transaction.category))
						newCategories.push(transaction.category);
					transactionData.categoryName=transaction.category;
				}		
			}
			transactionsData.push(transactionData);
		}
		$.post("controller.php", {func:"addNewTransactions",account:account,transactions:JSON.stringify(transactionsData)
			,newCategories:JSON.stringify(newCategories)},transactionsAdded,"json");
		newTransactions=[];
		setActiveImportPage("firstPage");
		alert ("New transactions have been added.");
		mainTabFromName.transactions.loaded=false;
	} else {
		flashElement("#importTransactionsAccountSelect_chosen");
	}
}

/**Flashes the outline of an element
 * @param {HTMLElement|string|jquery} element The element to be flashed.
 *		Can be an element, a jquery-object or a selector-string.
 * @param {int} repeat Times to repeat the flash, default 5.
 * @param {int} interval Interval between each flash in milliseconds, default 100.
 * @returns {HTMLElement|string|jquery} What was passed to the element-parameter.*/
function flashElement(element,repeat,interval) {
	repeat=repeat||6;
	interval=interval||100;
	var repetition=0;
	var on=false;
	flash();
	function flash() {
		$(element).css("outline",(on=!on)?"2px solid red":"");
		if ((repetition+=.5)<repeat)
			setTimeout(flash,interval);
	}
	return element;
}

function transactionsAdded() {
	fetchTransactions().done(gotTransactions);
}

function normalizeDateString(string) {
	var match;
	string=string.replace(/\./g,'-');
	match=/^(?:(\d\d[-]\d\d[-]\d\d\d\d)|(\d\d\d\d[-]\d\d[-]\d\d))$/.exec(string);
	if (match) {
		if (match[1])
			return match[1].split('-').reverse().join('-')
		if (match[2])
			return match[2];
	}
	if (/^\d\d[-]\d\d[-]\d\d$/.exec(string)) {
		return ("20"+string).split('-').reverse().join('-');
	}
	return false;
}

function normalizeNumberString(string) {
	string=string.replace(/ |,/g,function(match) {return (match===" ")?"":".";})
	if (string.match(/\d+[.]\d\d/))
		return string;
	return false;
}

function rowStringToCells(rowString) {
	var rowArray=rowString.split(/(?:\t \t)|\t/); 
	
	var rowObject={};
	for (var i=rowArray.length-1; i>=0; --i)
		rowObject[i]=rowArray[i].trim();
	return rowObject;
}

function guessColumns(rows) {
	var row=rows[0];
	var colGuesses=[];
	var dateCol,specCol,amountCol;
	for (var x in row) {
		if (row.hasOwnProperty(x)) {
			var cell=row[x];
			if (normalizeDateString(cell)) {
				if (dateCol>=0)
					colGuesses[dateCol]=null;
				colGuesses[x]="date";
				dateCol=x;
			} else if (normalizeNumberString(cell)){
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
	}
	return colGuesses;
}


/**Parses the transaction-data which the user has parsed into the text-area.
 * @returns {undefined}
 */
function parseRows() {
	var data=$("#parseRowsInput").val();
	newTransactions=data.split("\n");
	if (newTransactions.length) {
		for (var y=0; y<newTransactions.length; ++y) {
			if (!newTransactions[y].length) {//remove empty row
				newTransactions.splice(y--,1);
			} else
				newTransactions[y]=rowStringToCells(newTransactions[y]);
		}
		handleParsedTransactions();
	}
}

function handleParsedTransactions() {
	colAssignments=guessColumns(newTransactions);
	setupParseTransactionsGrid();
	$("#importTransactionsPages>."+activeImportTranactionsPage+" .importTransactionsContinueToCategorizeButton")[0]
			.disabled=false;
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
			var hit=true;
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
			if (transactionsAlikeThis[i].category!==item.category) {
				transactionsAlikeThis[i].suggestedCategory=item.category;
				suggestCategoryForNewTransaction(transactionsAlikeThis[i]);
			}
		}
	}
}

function suggestCategoryForNewTransaction(transaction) {
	if (transaction.suggestedCategory) {
		for (var fieldI=0; newTransactionsGridFields[fieldI].name!=="category"; ++fieldI);
		var rowI=newTransactions.indexOf(transaction);
		var td$=$("#categorizeTransactionsGrid>.jsgrid-grid-body tr:nth-child("+(rowI+1)+")>td:nth-child("+(fieldI+1)+")");
		if (transaction.viewed) {
			td$.find(">button").remove();
			var button=document.createElement("BUTTON");
			button.innerHTML=transaction.suggestedCategory;
			td$[0].appendChild(button);
			$(button).click(followSuggestion);
		} else {
			setCategoryToSuggested();
		}
		function followSuggestion() {
			button&&$(button).remove();
			setCategoryToSuggested();
			newTransactionsCategoryChange(transaction);
		}
		function setCategoryToSuggested() {
			td$.find("select").val(transaction.category=transaction.suggestedCategory).trigger("chosen:updated");
			delete transaction.suggestedCategory;
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

/**After the transactions-text have been parsed this function is called which then populates the grid with the parsed
 * data. This grid may have columns that have been identified incorrectly, and also some that the user want to ignore.
 * So the grid should provide the appropriate controls for that.
 * @returns {undefined}*/
function setupParseTransactionsGrid() {
	var categoryNames=["<Create New>","-"];
	
	var fieldTemplates={
		date:{ name:"date",title: "Datum",width:45},
		location:{ name:"location",title: "Land",width:45},
		specification:{ name: "specification", title:"Specifikation"},
		amount:{ name: "amount", title:"Belopp",inputType:"number",width:45}
	};
	var fields=[];
	var field;
	for (var i=0; i<colAssignments.length; ++i) {
		var colGuess=colAssignments[i];
		if (colGuess) {
			field=fieldTemplates[colGuess];
		} else {
			field={title:"Ignored"};
		}
		field.title="Column "+(i+1)+"<br>";
		
		//Needs to be a string otherwise jsgrid.js will generate an error by trying to call split() on it
		field.name=i.toString();
		
		fields[i]=field;
	}
	
	$("#importTransactionsPages>."+activeImportTranactionsPage+">.grid").jsGrid({
        width: "100%",
		height:"calc(100% - 265px)",
        sorting: true,
		data:newTransactions,
        fields: fields,
		noDataContent:null,
		confirmDeleting: false,
		inserting: false,
		onRefreshing:importTransactionsColAssignGridCreateFieldSelectors
		,onRefreshed:importTransactionsColAssignGridRefreshed
    });
	
	//When the select-elements are added to the TH-elements, they expand
	//gridBody.style.height=parseInt(gridBody.style.height)-20;
	
	//importTransactionsColAssignGridCreateFieldSelectors();
}

/**Creates the select-elements for the header-cells in the "Import Transasctions Column Assignment Grid"
 * @returns {undefined}*/
function importTransactionsColAssignGridCreateFieldSelectors() {
	var headerCells=$("#importTransactionsPages>."+activeImportTranactionsPage+">.grid>.jsgrid-grid-header th");
	if (!headerCells.find("SELECT").length) {
		var transactionFieldHeaders=[{text:'-',value:null},{text:'Date',value:'date'},
			{text:'Specification',value:'specification'},{text:'Amount',value:'amount'}
			,{text:'Location',value:'location'},{text:'Type',value:'type'}];
		for (var columnI=0; columnI<headerCells.length; ++columnI) {
			var headerCell=headerCells[columnI];
			var select=document.createElement("SELECT");
			for (var headerI=0; headerI<transactionFieldHeaders.length; ++headerI) {
				var option=document.createElement("OPTION");
				var transactionFieldHeader=transactionFieldHeaders[headerI];
				option.innerHTML=transactionFieldHeader.text;
				option.value=transactionFieldHeader.value;
				select.add(option);
				select.value=colAssignments[columnI];
			}
			$(select).change(onImportTransactionsColAssignGridSelectChange)
					.click(stopPropagation);//so that the column isn't sorted when changing column-field
			headerCell.appendChild(select);
		}
	}
}
function stopPropagation(e) {
	e.stopPropagation();
}

function onImportTransactionsColAssignGridSelectChange(e) {
	var newVal=this.value;
	var indexOfOldColumnWithThisValue=colAssignments.indexOf(newVal);
	if (indexOfOldColumnWithThisValue!==-1) {
		colAssignments[indexOfOldColumnWithThisValue]=null;
		importTransactionsColAssignGridRefreshed(indexOfOldColumnWithThisValue);
		var ths=$("#importTransactionsPages>."+activeImportTranactionsPage+">.grid>.jsgrid-grid-header th");
		$(ths[indexOfOldColumnWithThisValue]).find("SELECT").val('null');
	}
	colAssignments[this.parentElement.cellIndex]=this.value;
	importTransactionsColAssignGridRefreshed(this.parentElement.cellIndex);
}

function importTransactionsColAssignGridRefreshed(columnIndex) {
	var gridBody$=$("#importTransactionsPages>."+activeImportTranactionsPage+">.grid>.jsgrid-grid-body");
	var numColumns,i;
	if (columnIndex>=0) {
		i=columnIndex;
	} else {
		i=0;
		numColumns=colAssignments.length;
	}
	do{
		var columnCells$=gridBody$.find(" td:nth-child("+(i+1)+")");
		if (colAssignments[i]===null||colAssignments[i]==='null')
			columnCells$.addClass("unknownColumn");
		else
			columnCells$.removeClass("unknownColumn");
	} while(i++<numColumns);
}

function setupImportTransactionsCategorizeGrid() {
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
		location:{ name:"location",title: "Plats", type: "inputRender",width:40},
		specification:{ name: "specification", title:"Specifikation", type: "inputRender"},
		amount:{ name: "amount", title:"Belopp", type: "inputRender",inputType:"number",width:30},
		category:{ name: "category", title:"Kategori", type: "chosenView",options:categoryNames,width:40
			,changeCallback:newTransactionsCategoryChange},
		control:{type:"control", editButton:false, width:10}
	};
	var fieldNames=["date","location","specification","amount","category","control"];
	newTransactionsGridFields=[];
	for (var i=0; i<fieldNames.length; ++i) {
		var template=fieldTemplates[fieldNames[i]];
		newTransactionsGridFields.push(template);
	}
	$("#categorizeTransactionsGrid").jsGrid({
        width: "100%",
		height:"calc(100% - 285px)",
        sorting: true,
		data:newTransactions,
        deleteConfirm: "Delete this transaction?",
        fields: newTransactionsGridFields,
		noDataContent:null,
		confirmDeleting: false,
		inserting: true
    })
	
	//if settiing onRefreshed directly in the constructor and then programmatically clicking and removing the
	//insert-row-button then the refreshed-function will be called twice. So it's done like this instead.
	.find(".jsgrid-insert-mode-button").click().end()
	.jsGrid("option", "onRefreshed", newTransactionsGridRefresh)
	.find(".jsgrid-insert-mode-button").remove();
}

function newTransactionsGridRefresh() {
	for (var i=newTransactions.length-1; i>=0; --i) {
		suggestCategoryForNewTransaction(newTransactions[i]);
	}
	if (newTransactions.length)
		updateNewTransactionsViewedStatuses();
}

function updateNewTransactionsViewedStatuses() {
	var newRowsGridBody=$("#categorizeTransactionsGrid>.jsgrid-grid-body").scroll(newTransactionsGridScroll)[0];
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
			input.value=value||"";
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
			}
			select.value=value?value:'-';
				
			setTimeout(chosenize);//wont be correctly "chosenized" before having been added to DOM
			return select;
			
			function chosenize() {
				$(select).chosen({
					has_create_option:true,on_create_option:null
					//no_results_text:offerToCreateOption
					})
				.next().css("width","100%");
			}
		},
		editValue:function() {
			var value=this.editSelect.value;
			if (value=='-')
				return null;
			return value;
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