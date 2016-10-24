<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of Transaktionskoll
 *
 * @author oscar
 */
class Crackshell {
	
	public function getTransactions() {
		global $db;
		$transactions=$db->query(
			"SELECT id,date,amount,specification,location,addedAt,categoryId,accountId FROM transactions"
			)->fetchAll(PDO::FETCH_ASSOC);
		return $transactions;
	}
	
	public function getCategories() {
		global $db;
		$categories=$db->query("SELECT id,name,parentId FROM categories")->fetchAll(PDO::FETCH_ASSOC);
		return $categories;
	}
	
	/**
	 * 
	 * @global PDO $db
	 * @param type $accountName
	 */
	protected function getAccountId($accountName) {
		global $db;
		$prep=$db->prepare("SELECT id FROM accounts WHERE name=?");
		if ($prep->execute([$accountName])) {
			$id=$prep->fetch(PDO::FETCH_COLUMN);
		}
		return $id;
	}
	
	protected function createAccount($accountName) {
		global $db;
		$prep=$db->prepare("INSERT INTO accounts (name) VALUES(?)");
		$prep->execute([$accountName]);
		return $db->lastInsertId();
	}
	
	public function addTransactions($transactions,$newCategories,$accountName) {
		global $db;
		foreach ($newCategories as $categoryName) {
			$newCategoryIdByName[$categoryName]=$this->createCategory($categoryName);
		}
		
		if ($accountName) {
			$accountId=$this->getAccountId($accountName);
			if (!$accountId) {
				$accountId=$this->createAccount($accountName);
			}
		} else {
			$accountId=null;
		}
		
		
		foreach ($transactions as $transac) {
			$values[]=$transac['date'];
			$values[]=$transac['amount'];
			$values[]=$transac['specification'];
			$values[]=$transac['location'];
			$values[]=$transac['type'];
			if (isset($transac['categoryId'])) {
				$values[]=$transac['categoryId'];
			} else if (isset($transac['categoryName'])) {
				$values[]=$newCategoryIdByName[$transac['categoryName']];
			} else {
				$values[]=null;
			}
			$values[]=$accountId;
		}
		$placeHolders_imploded=implode(',',array_fill(0,count($transactions),'(?,?,?,?,?,?,?)'));
		$prepared=$db->prepare
			("INSERT INTO transactions (date,amount,specification,location,type,categoryId,accountId)".PHP_EOL
			."VALUES $placeHolders_imploded");
		$prepared->execute($values);
	}
	
	/**
	 * 
	 * @global PDO $db
	 * @param type $accountName
	 */
	protected function getCategoryId($categoryName) {
		global $db;
		$prep=$db->prepare("SELECT id FROM categories WHERE name=?");
		if ($prep->execute([$categoryName])) {
			$id=$prep->fetch(PDO::FETCH_COLUMN);
		}
		return $id;
	}
	
	public function createCategory($name) {
		global $db;
		$prepared=$db->prepare("INSERT INTO categories (name) VALUES (?)");
		$prepared->execute([$name]);
		return $db->lastInsertId();
	}
	
	public function deleteCategory($id) {
		global $db;
		$db->exec("DELETE FROM categories WHERE id=$id");
	}
	
	public function editTransaction($id,$changes) {
		global $db;
		$result=[];
		if (isset($changes['categoryName'])) {
			$categoryId=$this->getCategoryId($changes['categoryName']);
			if (!$categoryId)
				$categoryId=$this->createCategory($changes['categoryName']);
			$changes['categoryId']=$categoryId;
			$result['newCategory']=['id'=>$categoryId,'name'=>$changes['categoryName']];
		}
		unset ($changes['categoryName']);
		if (isset($changes['accountName'])) {
			$accountId=$this->getAccountId($changes['accountName']);
			if (!$accountId)
				$accountId=$this->createAccount($changes['accountName']);
			$changes['accountId']=$accountId;
			$result['newAccount']=['id'=>$accountId,'name'=>$changes['accountName']];
		}
		unset ($changes['accountName']);
		foreach ($changes as $key=>$val) {
			$sets[]="$key=?";
			$vals[]=$val;
		}
		$sets_imploded=implode(',',$sets);
		$prep=$db->prepare("UPDATE transactions SET $sets_imploded WHERE id=$id");
		$prep->execute($vals);
		return $result;
	}
	
	public function getMonthTransactions($year,$month,$aboveId=0) {
		global $db;
		$date="$year-$month-01";
		$transactions=$db->query(
			"SELECT transactions.id,`date`,amount,specification,location,categories.name category,
				UNIX_TIMESTAMP(addedAt)addedAt".PHP_EOL
				."FROM transactions".PHP_EOL
				."LEFT JOIN categories on categoryId=categories.id".PHP_EOL
			."WHERE `date` BETWEEN '$date' AND DATE_ADD('$date', INTERVAL 1 MONTH)"
			." AND transactions.id>$aboveId ORDER BY transactions.id")->fetchALL(PDO::FETCH_ASSOC);
		return $transactions;
	}
	
	/**
	 * 
	 * @global PDO $db
	 * @param type $year
	 * @param type $month
	 */
	public function getMonthCategoriesSums($year,$month) {
		global $db;
		$date="$year-$month-01";
		$prep=$db->prepare(
			"SELECT SUM(amount)amount,categories.name category FROM transactions".PHP_EOL
			."JOIN categories on categoryId=categories.id".PHP_EOL
			."WHERE `date` BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH)".PHP_EOL
			."GROUP BY categoryId,SIGN(amount)");
		$prep->execute([$date,$date]);
		return $prep->fetchAll(PDO::FETCH_ASSOC);
	}
	
	public function getAccounts() {
		global $db;
		$accounts=$db->query("SELECT id,name FROM accounts")->fetchAll(PDO::FETCH_ASSOC);
		return $accounts;
	}
	
	public function deleteTransaction($transactionId) {
		global $db;
		return $db->exec("DELETE FROM transactions WHERE id=$transactionId");
	}
}
