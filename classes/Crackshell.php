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
	
	public function getData($sinceTransactionId,$sinceCategoryId) {
		global $db;
		$transactions=$db->query(
			"SELECT transactions.id,date,amount,specification,country,categories.name category
				,UNIX_TIMESTAMP(addedAt)addedAt".PHP_EOL
			."FROM transactions".PHP_EOL
			."LEFT JOIN categories on categoryId=categories.id".PHP_EOL
			."WHERE transactions.id>0 ORDER BY transactions.id")->fetchAll(PDO::FETCH_ASSOC);
		$categories=$db->query("SELECT id,name,parentId FROM categories WHERE id>$sinceCategoryId ORDER BY id")
			->fetchAll(PDO::FETCH_ASSOC);
		return ['transactions'=>$transactions,'categories'=>$categories];
	}
	
	public function addTransactions($transactions,$newCategories) {
		global $db;
		foreach ($newCategories as $categoryName) {
			$newCategoryIdByName[$categoryName]=$this->createCategory($categoryName);
		}
		foreach ($transactions as $transac) {
			$values[]=$transac['date'];
			$values[]=$transac['amount'];
			$values[]=$transac['specification'];
			$values[]=$transac['country'];
			if (isset($transac['categoryId'])) {
				$values[]=$transac['categoryId'];
			} else if (isset($transac['categoryName'])) {
				$values[]=$newCategoryIdByName[$transac['categoryName']];
			} else {
				$values[]=null;
			}
		}
		$placeHolders_imploded=implode(',',array_fill(0,count($transactions),'(?,?,?,?,?)'));
		$prepared=$db->prepare
			("INSERT INTO transactions (date,amount,specification,country,categoryId) VALUES $placeHolders_imploded");
		$prepared->execute($values);
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
			$categoryId=$changes['categoryId']=$this->createCategory($changes['categoryName']);
			$result['newCategory']=['id'=>$categoryId,'name'=>$changes['categoryName']];
			unset ($changes['categoryName']);
		}
		foreach ($changes as $key=>$val) {
			$sets[]="$key=?";
			$vals[]=$val;
		}
		$sets_imploded=implode(',',$sets);
		$prep=$db->prepare("UPDATE transactions SET $sets_imploded WHERE id=$id");
		$prep->execute($vals);
		return $result;
	}
}
