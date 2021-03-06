<?php
setupDB();
function setupDB() {
	global $db,$dbvars,$development;
	$db=new PDO("mysql:host=$dbvars[host];dbname=$dbvars[dbName];charset=utf8",$dbvars['userName'],$dbvars['password']);
	if ($development) {
		$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	}

	if (empty($db->query('SHOW TABLES;')->fetch())) {
		$dbVersion=0;
	} else {
		$dbVersion=$db->query("SELECT version FROM variables")->fetch(PDO::FETCH_COLUMN);
	}
	migrate($dbVersion);
}

function migrate($dbVersion) {
	global $db;
	$migrations=getMigrations();
	foreach ($migrations as $migrationVersion=>$migration) {
		if (version_compare($dbVersion, $migrationVersion)==-1) {
			//echo "Upgrading DB from version '$dbVersion' to '$migrationVersion'...";
			foreach ($migration as $action) {
				if (is_string($action)) {
					$db->exec($action);
				}
			}
			$db->exec("\nUPDATE variables SET version='$migrationVersion'");
			$dbVersion=$migrationVersion;
			//echo "DB version is now '$dbVersion'.";
		}
	}
	//echo "\nDB version is now $dbVersion";
}

function getMigrations() {
	$migrations=[
		'1.0.0'=> [
			"CREATE TABLE transactions (
				`date` DATE NULL,
				amount DECIMAL NULL,
				specification varchar(100) NULL
			)
			ENGINE=InnoDB
			DEFAULT CHARSET=utf8mb4
			COLLATE=utf8mb4_general_ci;",

			"CREATE TABLE variables (version varchar(100) NULL COMMENT 'DB-version')
			ENGINE=InnoDB
			DEFAULT CHARSET=utf8mb4
			COLLATE=utf8mb4_general_ci;",

			"INSERT INTO variables (version) VALUES (0)",
			
			"ALTER TABLE transactions ADD country varchar(100) NULL;",
			
			"ALTER TABLE transactions MODIFY COLUMN amount decimal(10,2) NULL;",
			
			"ALTER TABLE transactions ADD addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL;",
			
			"CREATE TABLE categories (
				name varchar(100) NOT NULL,
				parentId varchar(100) NULL,
				id INT NULL AUTO_INCREMENT,
				CONSTRAINT categories_PK PRIMARY KEY (id)
			)
			ENGINE=InnoDB
			DEFAULT CHARSET=utf8mb4
			COLLATE=utf8mb4_general_ci;
			",
			
			"ALTER TABLE transactions ADD id INT NOT NULL;",
			
			"CREATE INDEX transactions_id_IDX ON transactions (id);",
			
			"ALTER TABLE transactions MODIFY COLUMN id int(11) NOT NULL AUTO_INCREMENT;
			ALTER TABLE transactions ADD CONSTRAINT transactions_PK PRIMARY KEY (id);",
			
			"ALTER TABLE transactions ADD categoryId INT NULL;
			ALTER TABLE transactions ADD CONSTRAINT transactions_categories_FK FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT;",
			
			"CREATE TABLE Links (
				id INT NULL AUTO_INCREMENT,
				regex VARCHAR(100) NULL,
				orderNumber INT NULL,
				CONSTRAINT Links_PK PRIMARY KEY (id)
			)
			ENGINE=InnoDB
			DEFAULT CHARSET=utf8mb4
			COLLATE=utf8mb4_general_ci;",
			
			"ALTER TABLE categories MODIFY COLUMN id int(11) NOT NULL AUTO_INCREMENT FIRST;",
			
			"ALTER TABLE transactions MODIFY COLUMN `id` int(11) NOT NULL AUTO_INCREMENT FIRST;",
			
			"ALTER TABLE transactions CHANGE country location varchar(100) NULL;",
			
			"CREATE TABLE accounts (
				id int NOT NULL AUTO_INCREMENT,
				name varchar(100) NULL,
				CONSTRAINT accounts_PK PRIMARY KEY (id)
			)
			ENGINE=InnoDB
			DEFAULT CHARSET=utf8mb4
			COLLATE=utf8mb4_general_ci;",
			
			"DROP TABLE Links;",
			
			"CREATE INDEX accounts_name_IDX ON accounts (name);",
			
			"ALTER TABLE transactions ADD accountId INT NULL;
			ALTER TABLE transactions ADD CONSTRAINT transactions_accounts_FK FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT;",
			
			"ALTER TABLE transactions ADD `type` varchar(100) NULL;"
		]
	];
	return $migrations;
}