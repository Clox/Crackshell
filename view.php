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
	
	<!--crackshell-->
	<script src="js/crackshell.js"></script>
	<link rel="stylesheet" type="text/css" href="css/crackshell.css"/>
	
</head>
<body>
	<div id="mainTabs">
		<ul>
			<li><a href="#mainTabs-1">Transaktioner</a></li>
			<li><a href="#mainTabs-2">Lägg till</a></li>
			<li><a href="#mainTabs-3">Kategorier</a></li>
		</ul>
		<div id="mainTabs-1">
			<div id="viewGrid"></div>
		</div>
		<div id="mainTabs-2">
			<textarea id="parseRowsInput"></textarea>
			<button id="parseRowsButton">OK</button>
			<hr>
			<div id="newRowsGrid"></div>
			<button id="addNewRowsButton">Add</button>
		</div>
		<div id="mainTabs-3">
			<div id="categoriesGrid"></div>
		</div>
	</div>
</body>
	
<?php