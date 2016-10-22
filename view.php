<head>
	
	<script src="js/libs/jquery-3.1.1.js"></script>
	
	<!--jsgrid-->
	<link type="text/css" rel="stylesheet" href="js/libs/jsgrid/jsgrid.css"/>
	<link type="text/css" rel="stylesheet" href="js/libs/jsgrid/jsgrid-theme.css"/>
	<script type="text/javascript" src="js/libs/jsgrid/jsgrid.js"></script>
	
	<!--jqueryUI-->
	<script src="js/libs/jquery-ui-1.11.4.custom/jquery-ui.js"></script>
	<link rel="stylesheet" type="text/css" href="js/libs/jquery-ui-1.11.4.custom/jquery-ui.theme.min.css"/>
	<link rel="stylesheet" type="text/css" href="js/libs/jquery-ui-1.11.4.custom/jquery-ui.min.css"/>
	<link rel="stylesheet" type="text/css" href="js/libs/jquery-ui-1.11.4.custom/jquery-ui.structure.min.css"/>
	
	<!--month-picker-->
	<script src="js/libs/KidSysco-jquery-ui-month-picker-6bf5fcb/src/MonthPicker.js"></script>
	<link rel="stylesheet" type="text/css" href="js/libs/KidSysco-jquery-ui-month-picker-6bf5fcb/src/MonthPicker.css"/>
	
	<!--chosen-->
	<script src="js/libs/chosen/chosen.jquery.js"></script>
	<link rel="stylesheet" href="js/libs/chosen/chosen.css"/>
	
	<!--highcharts-->
	<script src="js/libs/Highcharts/js/highcharts.js"></script>
	<script src="js/libs/Highcharts/js/modules/data.js"></script>
	<script src="js/libs/Highcharts/js/modules/drilldown.js"></script>
	
	<!--crackshell-->
	<script src="js/crackshell.js"></script>
	<link rel="stylesheet" type="text/css" href="css/crackshell.css"/>
	
</head>
<body>
	<div id="mainTabs">
		<ul>
			<li><a href="#mainTabs-1">Transaktioner</a></li>
			<li><a href="#mainTabs-2">Importera</a></li>
			<li><a href="#mainTabs-3">Kategorier</a></li>
			<li><a href="#mainTabs-4">Raporter</a></li>
		</ul>
		<div id="mainTabs-1">
			<div id="viewGrid"></div>
		</div>
		<div id="mainTabs-2"><!--import tab-->
			<div id="importTransactionsPages"><!--import pages-->
				<div class="page firstPage"><!--type of import selection page-->
					<button class="textParsing">Parse Text</button>
				</div>
				<div class="page textParsing"><!--text parsing page-->
					<textarea id="parseRowsInput"></textarea>
					<button id="parseRowsButton">Parse</button>
					<hr>
					<div id="parseTransactionsGrid"></div>
					<div class="bottomButtons">
						<button class="cancel">Cancel</button>
						<button id="addNewRowsButton" disabled="true">Continue</button>
					</div>
				</div>
				<div class="page categorize"><!--transaction categorize page-->
					<div id="categorizeTransactionsGrid"></div>
					<div class="bottomButtons">
						<button class="cancel">Cancel</button>
						<button id="commitNewTransactions">Commit</button>
					</div>
				</div>
			</div>
		</div>
		<div id="mainTabs-3">
			<div id="categoriesGrid"></div>
		</div>
		<div id="mainTabs-4"><!--reports tab-->
			<div id="reportsMonthPicker"></div>
			<div id="piechartContainer" style="min-width: 310px; max-width: 1000px; height: 700px; margin: 0 auto"></div>
		</div>
	</div>
</body>
	
<?php