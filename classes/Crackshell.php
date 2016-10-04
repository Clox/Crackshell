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
	/**
	 * 
	 * @global PDO $db
	 * @return type
	 */
	public function getTransactions() {
		global $db;
		$transactions=$db->query(
			"SELECT id,date,amount,specification,country,categoryId,UNIX_TIMESTAMP(addedAt)addedAt FROM transactions")
			->fetchAll(PDO::FETCH_ASSOC);
		return $transactions;
	}
	
	public function addTransactions($transactions) {
		global $db;
		$values=[];
		foreach ($transactions as $transac) {
			$values[]=$transac['date'];
			$values[]=$transac['amount'];
			$values[]=$transac['specification'];
			$values[]=$transac['country'];
		}
		$placeHolders_imploded=implode(',',array_fill(0,count($transactions),'(?,?,?,?)'));
		$prepared=$db->prepare
				("INSERT INTO transactions (date,amount,specification,country) VALUES $placeHolders_imploded");
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
	
	public function getCategories() {
		global $db;
		return $db->query("SELECT id,name,parentId FROM categories")->fetchAll(PDO::FETCH_NAMED);
	}
	
	public function editTransaction($id,$changes) {
		global $db;
		foreach ($changes as $key=>$val) {
			$sets[]="$key=?";
			$vals[]=$val;
		}
		$sets_imploded=implode(',',$sets);
		$prep=$db->prepare("UPDATE transactions SET $sets_imploded WHERE id=$id");
		$prep->execute($vals);
	}
}
