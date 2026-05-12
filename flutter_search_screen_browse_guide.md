# Flutter Search Screen: Browse Category Integration Guide 🔍

এই ডকুমেন্টটি Flutter ডেভেলপারদের জন্য তৈরি করা হয়েছে যাতে তারা সার্চ স্ক্রিনে **Browse Category** ফিচারটি সঠিকভাবে ইমপ্লিমেন্ট করতে পারে। এখানে থিম থেকে শুরু করে সার্ভিস পর্যন্ত একটি হায়ারার্কিকাল (Hierarchical) ফ্লো বর্ণনা করা হয়েছে।

---

## ১. ব্রাউজ ফ্লো ওভারভিউ (Browse Flow Overview)

সার্চ স্ক্রিনে ক্যাটাগরি ব্রাউজ করার লজিক্যাল স্টেপগুলো নিচে দেওয়া হলো:

1. **Step 1: Category Listing** (ডিফল্টভাবে সব ক্যাটাগরি দেখাবে, অথবা থিম অনুযায়ী ফিল্টার হবে)
2. **Step 2: Sub-category Selection** (ক্যাটাগরি অনুযায়ী সাব-ক্যাটাগরি লোড হবে)
3. **Step 3: Service Listing** (সিলেক্টেড সাব-ক্যাটাগরি বা ক্যাটাগরি অনুযায়ী সার্ভিস লোড হবে)

---

## ২. এপিআই এন্ডপয়েন্ট এবং কুয়েরি (API Endpoints)

### **ক. ক্যাটাগরি ফেচ করা (All or By Theme)**
ইউজার কোনো **Theme** সিলেক্ট না করলে সব ক্যাটাগরি আসবে, আর সিলেক্ট করলে ঐ থিমের ক্যাটাগরি আসবে।
- **URL:** `GET /api/v1/category`
- **Query Params:**
  - `type`: `category`
  - `theme`: (ঐচ্ছিক, যদি ইউজার ফিল্টার করতে চায়)
  - `limit`: `100`

### **খ. সাব-ক্যাটাগরি ফেচ করা (By Parent Category)**
যখন ইউজার একটি **Category**-তে ক্লিক করবে, তখন তার আন্ডারে থাকা সাব-ক্যাটাগরিগুলো ফেচ করুন:
- **URL:** `GET /api/v1/category`
- **Query Params:**
  - `parent`: `CATEGORY_ID` (ক্যাটাগরির MongoDB _id)
  - `type`: `subcategory`

### **গ. সার্ভিস ফেচ করা (Final Results)**
সাব-ক্যাটাগরি বা ক্যাটাগরি অনুযায়ী সার্ভিসগুলো ফেচ করার জন্য:
- **URL:** `GET /api/v1/services`
- **Query Params:**
  - `category`: `CATEGORY_ID`
  - `subCategory`: `SUBCATEGORY_ID` (ঐচ্ছিক, যদি ইউজার সাব-ক্যাটাগরি সিলেক্ট করে)

---

## ৩. স্টেট ম্যানেজমেন্ট এবং লজিক (Flutter Logic)

সার্চ স্ক্রিনে এই ডাইনামিক লোডিং হ্যান্ডেল করার জন্য নিচের `BrowseProvider` ক্লাসটি ফলো করতে পারেন।

```dart
class BrowseProvider with ChangeNotifier {
  final CategoryService _apiService = CategoryService();
  
  // ১. প্রাথমিক থিম লিস্ট
  final List<String> themes = ['ALL', 'PHOTOGRAPHY', 'VIDEOGRAPHY', 'EDITING & POST-PRODUCTION'];
  
  String selectedTheme = 'ALL';
  List<CategoryModel> categories = [];
  CategoryModel? selectedCategory;
  
  List<CategoryModel> subCategories = [];
  CategoryModel? selectedSubCategory;
  
  List<ServiceModel> services = [];
  bool isLoading = false;

  // --- Actions ---

  // ক্যাটাগরি লোড করা (থিম থাকতেও পারে নাও পারে)
  Future<void> loadCategories({String? theme}) async {
    selectedTheme = theme ?? 'ALL';
    selectedCategory = null;
    selectedSubCategory = null;
    categories = [];
    subCategories = [];
    services = [];
    
    isLoading = true;
    notifyListeners();
    
    // API: theme 'ALL' হলে theme প্যারামিটার পাঠানোর দরকার নেই
    categories = await _apiService.getCategories(
      type: 'category',
      theme: selectedTheme == 'ALL' ? null : selectedTheme,
    );
    
    isLoading = false;
    notifyListeners();
  }

  // ক্যাটাগরি সিলেক্ট করা এবং সাব-ক্যাটাগরি লোড করা
  Future<void> onCategorySelected(CategoryModel category) async {
    selectedCategory = category;
    selectedSubCategory = null;
    subCategories = [];
    services = [];
    notifyListeners();

    isLoading = true;
    notifyListeners();
    
    // API: GET /api/v1/category?parent=${category.id}&type=subcategory
    subCategories = await _apiService.getSubCategories(category.id);
    
    // যদি সাব-ক্যাটাগরি না থাকে, তাহলে সরাসরি এই ক্যাটাগরির সার্ভিস লোড করুন
    if (subCategories.isEmpty) {
      await fetchServices();
    }
    
    isLoading = false;
    notifyListeners();
  }

  // সাব-ক্যাটাগরি সিলেক্ট করা এবং সার্ভিস লোড করা
  Future<void> onSubCategorySelected(CategoryModel subCat) async {
    selectedSubCategory = subCat;
    notifyListeners();
    await fetchServices();
  }

  // সার্ভিস ফেচ করার মেথড
  Future<void> fetchServices() async {
    isLoading = true;
    notifyListeners();
    
    // API: GET /api/v1/services?category=${selectedCategory?.id}&subCategory=${selectedSubCategory?.id}
    services = await _apiService.getServices(
      categoryId: selectedCategory?.id,
      subCategoryId: selectedSubCategory?.id,
    );
    
    isLoading = false;
    notifyListeners();
  }
}
```

---

## ৪. ইউজার ইন্টারফেস গাইডলাইন (UI Workflow)

1. **Initial Search View:** ইউজার যখন সার্চ আইকনে ক্লিক করবে, তখন তাকে প্রথমে **Themes** (e.g., Photography, Videography cards) দেখান।
2. **Themes Clicked:** কোনো থিমে ক্লিক করলে স্লাইড করে বা নেভিগেট করে ঐ থিমের **Categories** গ্রিড বা লিস্ট দেখান।
3. **Category Clicked:** ক্যাটাগরিতে ক্লিক করলে উপরের দিকে (Breadcrumbs) ক্যাটাগরির নাম দেখান এবং নিচে তার **Sub-categories** দেখান।
4. **Sub-category Clicked:** সাব-ক্যাটাগরিতে ক্লিক করলে ফাইনাল **Service List** (সার্ভিস কার্ডসহ) দেখান।

> [!IMPORTANT]
> **Empty State Handling:** যদি কোনো ক্যাটাগরির আন্ডারে সাব-ক্যাটাগরি না থাকে, তবে সরাসরি ঐ ক্যাটাগরির সার্ভিসগুলো রেন্ডার করতে হবে। 

> [!TIP]
> সার্চ স্ক্রিনের উপরে একটি **Search Bar** রাখুন যা দিয়ে ইউজার সরাসরি নাম লিখেও খুঁজতে পারে। নাম লিখে খুঁজলে ক্যাটাগরি ফিল্টারগুলো রিসেট হয়ে যাবে।

---

## ৫. এপিআই রেসপন্স ফরম্যাট (Sample JSON)

### **Category/Subcategory Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "651a...",
        "name": "Wedding Photography",
        "theme": "PHOTOGRAPHY",
        "type": "category",
        "image": "url_here"
      }
    ]
  }
}
```

### **Service List Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "672b...",
        "title": "Professional Portrait Session",
        "price": 500,
        "category": { "name": "Portrait" },
        "providerId": { "name": "John Doe" }
      }
    ]
  }
}
```

---
**Happy Coding!** 🚀
