enum PermissionLevel {
  ADMIN = "admin",

  USER = "user",
  USER_ELEVATED = "user.elevated",
  USER_MASQUERADE = "user.masquerade",

  API_KEY = "api_key",
  API_KEY_VIEW = "api_key.view",
  API_KEY_CREATE = "api_key.create",
  API_KEY_UPDATE = "api_key.update",
  API_KEY_DELETE = "api_key.delete",

  FILE = "file",
  FILE_CREATE = "file.create",
  FILE_UPDATE = "file.update",
  FILE_DELETE = "file.delete",

  FILE_TAG = "file_tag",
  FILE_TAG_CREATE = "file_tag.create",
}

export default PermissionLevel;
