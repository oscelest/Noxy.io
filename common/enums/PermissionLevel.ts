enum PermissionLevel {
  ADMIN = "admin",

  API_KEY = "api_key",
  API_KEY_VIEW = "api_key.view",
  API_KEY_CREATE = "api_key.create",
  API_KEY_UPDATE = "api_key.update",
  API_KEY_DELETE = "api_key.delete",

  PAGE = "page",
  PAGE_CREATE = "page.create",
  PAGE_UPDATE = "page.update",
  PAGE_DELETE = "page.delete",

  FILE = "file",
  FILE_CREATE = "file.create",
  FILE_UPDATE = "file.update",
  FILE_DELETE = "file.delete",

  FILE_TAG = "file_tag",
  FILE_TAG_CREATE = "file_tag.create",
  FILE_TAG_DELETE = "file_tag.delete",

  USER = "user",
  USER_ELEVATED = "user.elevated",
  USER_MASQUERADE = "user.masquerade",
}

export default PermissionLevel;
