<?php
require_once './settings.php';
if (php_sapi_name() === 'cli') {
	//$_GET=['func'=>'getInvestments','numHoldings'=>4,'factorSettings'=>'{"weightScoreDropRate":280}'];
	//$_POST=['func'=>'editTransaction','id'=>'8','changes'=>'{"category":"1","specification":"APOTEKET L RKAN1"}'];
	$_POST=['func'=>'addNewTransactions'];
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
	$sinceTransactionId=$vars['sinceTransactionId'];
	$sinceCategoryId=$vars['sinceCategoryId'];
	$crackshell=new Crackshell();
	$data=$crackshell->getData($sinceTransactionId,$sinceCategoryId);
	echo json_encode($data);
}

function controller_post_addNewTransactions($vars) {
	file_put_contents('testingdata.json', json_encode($vars));
	$vars=  json_decode(file_get_contents('testingdata.json'),true);
	$transactions=json_decode($vars['transactions'],true);
	$newCategories=json_decode($vars['newCategories'],true);
	$crackshell=new Crackshell();
	$crackshell->addTransactions($transactions,$newCategories);
	echo 1;
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
	$changes=json_decode($vars['changes'],true);
	$result=(new Crackshell)->editTransaction($transactionId,$changes);
	echo json_encode($result);
}