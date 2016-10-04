<?php
require_once './settings.php';
if (php_sapi_name() === 'cli') {
	//$_GET=['func'=>'getInvestments','numHoldings'=>4,'factorSettings'=>'{"weightScoreDropRate":280}'];
	$_POST=['func'=>'editTransaction','id'=>'8','changes'=>'{"category":"1","specification":"APOTEKET L RKAN1"}'];
} else {
	set_time_limit(120);
}
if (isset($_GET['func'])) {
	$funcName="controller_get_$_GET[func]";
	$funcName($_GET);
} else if (isset($_POST['func'])) {
	$funcName="controller_post_$_POST[func]";
	$funcName($_POST);
}

function controller_get_getTransactions($vars) {
	$crackshell=new Crackshell();
	$data=$crackshell->getTransactions();
	echo json_encode($data);
}

function controller_post_addNewTransactions($vars) {
	$transactions=$vars['transactions'];
	$transactions=json_decode($transactions,true);
	$crackshell=new Crackshell();
	$crackshell->addTransactions($transactions);
}

function controller_post_createCategory($vars) {
	$name=$vars['name'];
	$crackshell=new Crackshell();
	$id=$crackshell->createCategory($name);
	echo json_encode(['id'=>$id]);
}

function controller_get_getCategories() {
	$categories=(new Crackshell)->getCategories();
	echo json_encode($categories);
}

function controller_post_deleteCategory($vars) {
	$categoryId=$vars['id'];
	(new Crackshell)->deleteCategory($categoryId);
}

function controller_post_editTransaction($vars) {
	$transactionId=$vars['id'];
	$changes=json_decode($vars['changes']);
	(new Crackshell)->editTransaction($transactionId,$changes);
}