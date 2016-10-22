<?php
require_once './settings.php';
if (php_sapi_name() === 'cli') {
	//$_GET=['func'=>'getInvestments','numHoldings'=>4,'factorSettings'=>'{"weightScoreDropRate":280}'];
	$_POST=['func'=>'editTransaction','id'=>'8','changes'=>'{"category":"1","specification":"APOTEKET L RKAN1"}'];
	//$_POST=['func'=>'addNewTransactions'];
	//$_GET=['func'=>'getTransactions','sinceTransactionId'=>453,'sinceCategoryId'=>0];
	//$_GET=['func'=>'getMonthCategoriesSums','year'=>'2016','month'=>'10'];
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
	$transactions=(new Crackshell())->getTransactions();
	echo json_encode($transactions);
}

function controller_post_addNewTransactions($vars) {
	$transactions=json_decode($vars['transactions'],true);
	$newCategories=json_decode($vars['newCategories'],true);
	$account=$vars['account'];
	$crackshell=new Crackshell();
	$crackshell->addTransactions($transactions,$newCategories,$account);
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

function controller_get_getMonthTransactions($vars) {
	$year=$vars['year'];
	$month=$vars['month'];
	$aboveId=$vars['aboveId'];
	$crackshell=new Crackshell();
	$data=$crackshell->getMonthTransactions($year,$month,$aboveId);
	echo json_encode($data);
}

function controller_get_getMonthCategoriesSums($vars) {
	$year=$vars['year'];
	$month=$vars['month'];
	$crackshell=new Crackshell();
	echo json_encode($crackshell->getMonthCategoriesSums($year, $month));
}

function controller_get_getAccounts() {
	$accounts=(new Crackshell())->getAccounts();
	echo json_encode($accounts);
}