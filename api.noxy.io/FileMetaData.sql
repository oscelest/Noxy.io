-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.15 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table mikrorm.file_extension
DROP TABLE IF EXISTS `file_extension`;
CREATE TABLE IF NOT EXISTS `file_extension` (
  `id` varchar(36) NOT NULL,
  `name` varchar(16) NOT NULL,
  `type` enum('application','audio','font','image','text','video','unknown') NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `time_created` datetime NOT NULL,
  `time_updated` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `extension` (`mime_type`,`name`) USING BTREE,
  KEY `time_updated` (`time_updated`),
  KEY `time_created` (`time_created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table mikrorm.file_extension: ~27 rows (approximately)
/*!40000 ALTER TABLE `file_extension` DISABLE KEYS */;
INSERT INTO `file_extension` (`id`, `name`, `type`, `mime_type`, `time_created`, `time_updated`) VALUES
	('8f1004d8-d2df-4b4c-9068-3cc0050b1d91', 'png', 'image', 'image/png', '2021-05-06 22:27:55', '2021-05-06 22:27:55'),
	('aececa9a-58d9-4320-9421-eb8516c9a1ee', 'pdf', 'application', 'application/pdf', '2021-07-06 23:22:05', '2021-07-06 23:22:05'),
	('8162492d-74bf-4cc0-a121-608aae06d135', 'ico', 'image', 'image/x-icon', '2021-07-06 23:18:24', '2021-07-06 23:18:25'),
	('64227822-eda1-438d-8298-a772ef0291af', 'tiff', 'image', 'image/tiff', '2021-07-06 23:18:49', '2021-07-06 23:18:49'),
	('482367c6-f30f-44ff-8682-5b6b2b950f5f', 'mov', 'video', 'video/quicktime', '2021-07-07 23:14:05', '2021-07-07 23:14:05'),
	('f24c8231-c998-4d68-89f2-8030710c77bd', 'jpeg', 'image', 'image/jpeg', '2021-06-13 00:42:54', '2021-06-30 16:42:44'),
	('1388c5dc-0a48-4efb-a0f1-d9812bc4f018', 'jpe', 'image', 'image/jpeg', '2021-07-06 23:20:37', '2021-07-06 23:20:37'),
	('fa6a236c-9903-4d61-8b11-86da474e64ac', '3gp', 'audio', 'audio/3gpp', '2021-07-07 23:20:28', '2021-07-07 23:20:29'),
	('7fd93375-14f8-45ac-9aa5-6d9041c67f42', 'webm', 'video', 'video/webm', '2021-07-04 00:19:37', '2021-07-04 00:19:37'),
	('cb302f23-52e1-405d-bcfd-451b44c1fbaa', 'svg', 'image', 'image/svg+xml', '2021-05-08 13:50:44', '2021-05-08 13:50:44'),
	('32b4c0dd-4be8-47af-b67b-156545a76989', 'avif', 'image', 'image/avif', '2021-07-04 00:15:31', '2021-07-04 00:15:31'),
	('5f5d901c-71df-4ffd-b1af-542e67423f3e', '.7z', 'application', 'application/x-7z-compressed', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('ad9fd952-020a-4c2a-b451-8167e31f3d9a', '.s7z', 'application', 'application/x-7z-compressed', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('147b69fa-10c9-4611-aca2-ebd09fd80722', '.ace', 'application', 'application/x-ace-compressed', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('bd2c4a43-c9a0-4a8e-980e-a4d9a23887ce', '.afa', 'application', 'application/x-astrotite-afa', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('5e665fa4-6917-4480-a7af-077f175f8a5d', '.alz', 'application', 'application/x-alz-compressed', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('13376d7d-234c-47fc-9a00-1179bf1463a9', '.apk', 'application', 'application/vnd.android.package-archive', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('88e0f488-da51-4c28-8ee5-f06cdd31fd48', '.arc', 'application', 'application/octet-stream', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('daab8f5b-bef5-4006-947c-e6e1d6ddac56', '.ark', 'application', 'application/octet-stream', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('a8571fdf-28c9-4fcb-9653-d26f7b54d8b3', '.arc', 'application', 'application/x-freearc', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('68a6ab44-c2f5-4756-a74b-67b900196b03', '.cdx', 'application', 'application/x-freearc', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('8d8b5457-094f-42aa-8c95-62ae27320a47', '.arj', 'application', 'application/x-arj', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('1b5015cd-f392-4d53-aef1-7a9a2cbb2f09', '.b1', 'application', 'application/x-b1', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('d8587b36-881f-433f-b582-7d7280a97eca', '.cab', 'application', 'application/vnd.ms-cab-compressed', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('05b6a70a-788a-44ae-ba55-347749e2285b', '.cfs', 'application', 'application/x-cfs-compressed', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('a902d9de-8121-4458-a1ff-0db695c07477', '.dar', 'application', 'application/x-dar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('3309fbeb-ec5f-450a-a24b-3a5dc81cb734', '.dgc', 'application', 'application/x-dgc-compressed', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('4b971c7b-7a33-4989-aa96-8f836edd9cb7', '.dmg', 'application', 'application/x-apple-diskimage', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('ecdfc67f-bf95-4238-8af5-db381e5d699a', '.ear', 'application', 'application/java-archive', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('8c74352b-1817-464a-b47b-e0e7f4beda62', '.gca', 'application', 'application/x-gca-compressed', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('92d8da74-b2b6-42c1-9b9b-0577cd2bcde9', '.jar', 'application', 'application/java-archive', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('770427ed-f6ca-4f1c-9246-759980927d78', '.lzh', 'application', 'application/x-lzh', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('0ba79a1f-32ce-4f90-aabd-cb9cc1cdbb19', '.lha', 'application', 'application/x-lzh', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('d8df0b27-b23f-4c7f-8514-d1418e40a70e', '.lzx', 'application', 'application/x-lzx', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('802932c1-a744-435f-ab5e-ca754ce41a4c', '.rar', 'application', 'application/x-rar-compressed', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('c16c3cc6-58fa-4d8b-8a66-0f90c1395783', '.sit', 'application', 'application/x-stuffit', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('d9487ed6-1244-4e2e-aa7a-459acca7f409', '.sitx', 'application', 'application/x-stuffitx', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('a5c4ffb1-653d-4de7-9d91-922fa3ffaba2', '.tar.gz', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('5165efbd-c9fe-44c2-a3c7-f7eafca0472e', '.tgz', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('940c6005-a6a8-4715-8dc4-875416bc5a2c', '.tar.z', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('a808f427-9667-4f2e-aebf-315827b77349', '.tar.bz2', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('9ac2e4ea-d3fd-4b67-8ac5-18bbf9737da2', '.tbz2', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('1271130f-348e-48e4-a9ae-1865fdc5bc53', '.tar.lz', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('2395e727-05d8-462f-b724-eae71640e190', '.tlz', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('fad2070f-4418-4a20-974a-595c68f97408', '.tar.xz', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('4529be50-293b-4691-949f-22932fdc16df', '.txz', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('61db0592-00c9-44f5-bbd9-62c96b2345a0', '.tar.zst', 'application', 'application/x-gtar', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('08fff397-8e59-448c-9a1c-d1636ce3fa5b', '.wim', 'application', 'application/x-ms-wim', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('442a189e-d53e-4506-ab60-a9db95a04380', '.xar', 'application', 'application/x-ms-wim', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('cbdca205-6847-45d3-b1fd-63e1ec214907', '.zip', 'application', 'application/zip', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('b762b3c8-c190-49d2-a88f-ea9e0586d8ad', '.zipx', 'application', 'application/zip', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('ae5f1909-2e2e-4013-a82f-cac1d7ff4919', '.zoo', 'application', 'application/x-z00', '2021-07-07 23:42:46', '2021-07-07 23:42:46'),
	('e267cfb9-561d-4496-a2ac-5c86ffcf4460', 'apng', 'image', 'image/apng', '2021-07-04 00:14:02', '2021-07-04 00:14:03'),
	('e42fc2b0-5f04-4f8b-a9e2-a0f35c94b1d2', 'wave', 'audio', 'audio/wave', '2021-07-04 00:18:47', '2021-07-04 00:18:48'),
	('76f505db-f1f7-4c9f-a8bb-6757ee18abf6', 'bmp', 'image', 'image/bmp', '2021-07-06 23:18:13', '2021-07-06 23:18:13'),
	('4814c65f-1d9b-4129-b218-2a0560e0457f', 'jfi', 'image', 'image/jpeg', '2021-07-06 23:20:21', '2021-07-06 23:20:21'),
	('b48de753-d495-4b48-bcd0-20c6b5d7dacb', '3gp', 'video', 'video/3gpp', '2021-07-07 23:20:06', '2021-07-07 23:20:07'),
	('3d03bf44-1d3a-477a-a8ae-7a245e9a1b0e', 'jif', 'image', 'image/jpeg', '2021-07-06 23:20:08', '2021-07-06 23:20:08'),
	('e1ff58b8-18bb-41d5-b7f2-aa195e21a2fd', 'txt', 'text', 'text/plain', '2021-05-08 13:35:01', '2021-05-08 13:35:01'),
	('edc4278e-bb24-4e32-b346-e1573d7d8422', 'ogg', 'audio', 'audio/ogg', '2021-07-04 00:20:18', '2021-07-04 00:20:18'),
	('038d7e45-050c-405d-99ea-67e4a7d2f0e0', 'ini', 'application', 'application/octet-stream', '2021-05-09 18:15:25', '2021-05-09 18:31:25'),
	('20d69454-45a9-481f-a81e-903cdf6f8de8', 'webp', 'image', 'image/webp', '2021-07-04 00:17:00', '2021-07-04 00:17:01'),
	('57a46d9d-6a2f-4ca4-97a4-43f99563727b', 'jfif', 'image', 'image/jpeg', '2021-07-06 23:19:50', '2021-07-06 23:19:51'),
	('fd49b57c-65b1-4f26-8792-323cdb5b37aa', 'jpg', 'image', 'image/jpeg', '2021-05-06 21:15:49', '2021-05-06 21:15:49'),
	('dbee09c6-2972-42d8-8bbb-7d1367e1fc2e', 'gif', 'image', 'image/gif', '2021-07-04 00:16:11', '2021-07-04 00:16:11'),
	('fee0f264-053e-4302-8278-115046bd756d', '7z', 'application', 'application/x-7z-compressed	', '2021-07-07 23:32:11', '2021-07-07 23:32:11'),
	('f6d9c740-cd71-493a-8ea7-a130b6347689', 'qt', 'video', 'video/quicktime', '2021-07-07 23:14:16', '2021-07-07 23:14:17'),
	('b5dbd713-c434-459c-b08e-76bc2c83ba82', 'wav', 'audio', 'audio/wave', '2021-07-04 00:18:59', '2021-07-04 00:19:00'),
	('c2ce6ae7-4e54-4722-b5f7-b02edbb60042', 'mp4', 'video', 'video/mp4', '2021-05-08 14:32:16', '2021-05-09 18:31:29'),
	('d32d4ab6-2ff0-4130-9228-65a12c87b0cd', 'mp3', 'audio', 'audio/mpeg', '2021-05-08 14:26:19', '2021-05-08 14:26:41');
/*!40000 ALTER TABLE `file_extension` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;







































































