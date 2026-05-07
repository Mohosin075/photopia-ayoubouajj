# Flutter Category System Integration Guide 🚀

এই ডকুমেন্টটিতে Photopya প্রোজেক্টের **Theme -> Category -> Subcategory System**-কে কিভাবে Flutter অ্যাপের সাথে ইন্টিগ্রেট করবেন তার বিস্তারিত গাইডলাইন দেওয়া হলো। এখানে থিম ও ক্যাটাগরি ফেচ করা থেকে শুরু করে সার্ভিস ফিল্টারিং পর্যন্ত সব কাভার করা হয়েছে।

---

## ১. ডেটা মডেল তৈরি করা (Data Models)

প্রথমে আমাদের ক্যাটাগরি এবং সার্ভিসের জন্য Dart মডেল তৈরি করতে হবে। এগুলো ব্যাকএন্ডের Mongoose ইন্টারফেসের সাথে সামঞ্জস্যপূর্ণ।

### **Category Model**
`theme`, `parent` ক্যাটাগরি এবং সাব-ক্যাটাগরি হ্যান্ডেল করার জন্য এই মডেলটি ব্যবহার করুন।

```dart
class CategoryModel {
  final String id;
  final String name;
  final String? description;
  final String? image;
  final String? icon;
  final String? theme; // Theme of the category (e.g., PHOTOGRAPHY)
  final String? parent; // Parent category ID
  final String type; // 'category' or 'subcategory'
  final bool isPopular;
  final bool isActive;

  CategoryModel({
    required this.id,
    required this.name,
    this.description,
    this.image,
    this.icon,
    this.theme,
    this.parent,
    required this.type,
    this.isPopular = false,
    this.isActive = true,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['_id'],
      name: json['name'],
      description: json['description'],
      image: json['image'],
      icon: json['icon'],
      theme: json['theme'],
      parent: json['parent'] is Map ? json['parent']['_id'] : json['parent'],
      type: json['type'] ?? 'category',
      isPopular: json['isPopular'] ?? false,
      isActive: json['isActive'] ?? true,
    );
  }
}
```

---

## ২. API ইন্টিগ্রেশন (API Integration)

Theme, Category এবং Sub-category অনুযায়ী ডেটা ফেচ করার জন্য নিচের এপিআইগুলো ইন্টিগ্রেট করুন।

### **Themes List**
সাধারণত থিমগুলো অ্যাপে স্ট্যাটিক হিসেবে রাখা যায় বা ডাইনামিকভাবে এপিআই থেকে ইউনিক থিম বের করা যায়। প্রোজেক্টে প্রধানত নিচের ৩টি থিম রয়েছে:
```dart
const List<String> appThemes = [
  'PHOTOGRAPHY',
  'VIDEOGRAPHY',
  'EDITING & POST-PRODUCTION'
];
```

### **Category API Service**

```dart
class CategoryService {
  final Dio _dio = Dio(BaseOptions(baseUrl: BASE_URL));

  // নির্দিষ্ট থিমের আন্ডারে থাকা ক্যাটাগরি লিস্ট ফেচ করা
  Future<List<CategoryModel>> getCategoriesByTheme(String theme) async {
    try {
      final response = await _dio.get(
        '/api/v1/category',
        queryParameters: {
          'theme': theme,
          'type': 'category', // শুধুমাত্র মেইন ক্যাটাগরিগুলো আনবে
        },
      );
      if (response.statusCode == 200) {
        List data = response.data['data']['data'];
        return data.map((json) => CategoryModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  // কোনো নির্দিষ্ট ক্যাটাগরির সাব-ক্যাটাগরি ফেচ করা
  Future<List<CategoryModel>> getSubCategories(String parentCategoryId) async {
    try {
      final response = await _dio.get(
        '/api/v1/category',
        queryParameters: {
          'parent': parentCategoryId,
          'type': 'subcategory', // শুধুমাত্র সাব-ক্যাটাগরিগুলো আনবে
        },
      );
      if (response.statusCode == 200) {
        List data = response.data['data']['data'];
        return data.map((json) => CategoryModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  // জনপ্রিয় ক্যাটাগরি লিস্ট ফেচ করা
  Future<List<CategoryModel>> getPopularCategories() async {
    final response = await _dio.get('/api/v1/category/popular-categories');
    List data = response.data['data'];
    return data.map((json) => CategoryModel.fromJson(json)).toList();
  }
}
```

---

## ৩. সার্ভিস ক্রিয়েশন (Service Creation Workflow)

যখন একজন প্রফেশনাল কোনো সার্ভিস তৈরি করবেন, তখন তাকে অবশ্যই **Theme**, **Category** এবং (ঐচ্ছিক) **Sub-Category** সিলেক্ট করতে হবে।

### **স্টেপস:**

1. **Theme Selection:** প্রথমে ইউজারকে থিম সিলেক্ট করতে দিন (যেমন: PHOTOGRAPHY)।
2. **Category Selection:** থিম সিলেক্ট করার পর `getCategoriesByTheme(selectedTheme)` কল করে ঐ থিমের আন্ডারে থাকা ক্যাটাগরিগুলো দেখান।
3. **Sub-category Selection:** ইউজার ক্যাটাগরি সিলেক্ট করলে, ঐ ক্যাটাগরির আন্ডারে থাকা সাব-ক্যাটাগরিগুলো `getSubCategories(selectedCategoryId)` দিয়ে ফেচ করে দেখান।
4. সার্ভিস পোস্ট করার সময় নিচের পেলোড ব্যবহার করুন:

```json
{
  "title": "Professional Portraits",
  "category": "651a...abc1", // Category ID (Required)
  "subCategory": "651a...abc2", // Sub-category ID (Optional)
  "price": 500,
  "pricingType": "HOURLY"
  // ... other fields
}
```

> **নোট:** সার্ভিস ক্রিয়েট করার সময় `theme` সার্ভারে পাঠানোর দরকার নেই, শুধু `category` এবং `subCategory` ID পাঠালেই হবে।

---

## ৪. সার্ভিস ফিল্টারিং (Service Filtering)

সার্ভিস ফিল্টার করার সময় সবচেয়ে বড় ভুল হয় **ID**-এর পরিবর্তে **Name** পাঠানো অথবা কি-এর (Key) নাম ভুল হওয়া। আপনি **Theme**, **Category** এবং **Sub-category** তিনটির যেকোনো একটি দিয়ে সার্ভিস ফিল্টার করতে পারবেন।

### **গুরুত্বপূর্ণ কি-পলিমি:**
- **Theme Name**: ফিল্টার কি হবে `theme` (যেমন: 'PHOTOGRAPHY')
- **Category ID**: ফিল্টার কি হবে `category`
- **Sub-category ID**: ফিল্টার কি হবে `subCategory` (অবশ্যই CamelCase - বড় হাতের 'C' হবে)।
- **Value**: Category এবং Sub-category এর ক্ষেত্রে সবসময় MongoDB **_id** ব্যবহার করবেন।

### **ডাইনামিক ফিল্টারিং লজিক (Dart Example):**

```dart
Future<List<ServiceModel>> fetchServices({
  String? theme,
  String? categoryId,
  String? subCategoryId,
  String? searchTerm,
}) async {
  try {
    // ডাইনামিক কুয়েরি অবজেক্ট তৈরি করা
    Map<String, dynamic> query = {};
    
    if (theme != null && theme.isNotEmpty) {
      query['theme'] = theme;
    }

    if (categoryId != null && categoryId.isNotEmpty) {
      query['category'] = categoryId;
    }
    
    if (subCategoryId != null && subCategoryId.isNotEmpty) {
      // লক্ষ্য করুন: Backend 'subCategory' (CamelCase) এক্সপেক্ট করে
      query['subCategory'] = subCategoryId; 
    }
    
    if (searchTerm != null && searchTerm.isNotEmpty) {
      query['searchTerm'] = searchTerm;
    }

    final response = await _dio.get(
      '/api/v1/services',
      queryParameters: query,
    );

    if (response.statusCode == 200) {
      List data = response.data['data']['data'];
      return data.map((json) => ServiceModel.fromJson(json)).toList();
    }
    return [];
  } catch (e) {
    rethrow;
  }
}
```

---

## ৫. Provider দিয়ে স্টেট ম্যানেজমেন্ট (State Management with Provider)

অ্যাপের বিভিন্ন জায়গায় থিম, ক্যাটাগরি এবং সার্ভিসের ডেটা ম্যানেজ করার জন্য `Provider` ব্যবহার করা সবচেয়ে ভালো প্র্যাকটিস।

### **CategoryProvider ইমপ্লিমেন্টেশন:**

```dart
import 'package:flutter/material.dart';

class CategoryProvider with ChangeNotifier {
  final CategoryService _service = CategoryService();
  
  List<String> _themes = ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'EDITING & POST-PRODUCTION'];
  List<CategoryModel> _categories = [];
  List<CategoryModel> _subCategories = [];
  List<ServiceModel> _services = [];
  
  String? _selectedTheme;
  String? _selectedCategoryId;
  String? _selectedSubCategoryId;
  bool _isLoading = false;

  // Getters
  List<String> get themes => _themes;
  List<CategoryModel> get categories => _categories;
  List<CategoryModel> get subCategories => _subCategories;
  List<ServiceModel> get services => _services;
  bool get isLoading => _isLoading;
  String? get selectedTheme => _selectedTheme;
  String? get selectedCategoryId => _selectedCategoryId;

  // থিম সিলেক্ট করলে ক্যাটাগরি এবং সার্ভিস ফিল্টার করা
  Future<void> selectTheme(String theme) async {
    _selectedTheme = theme;
    _selectedCategoryId = null; // নতুন থিম নিলে ক্যাটাগরি রিসেট
    _selectedSubCategoryId = null;
    _categories = [];
    _subCategories = [];
    
    notifyListeners();
    
    await Future.wait([
      _loadCategoriesByTheme(theme),
      fetchFilteredServices(),
    ]);
  }

  Future<void> _loadCategoriesByTheme(String theme) async {
    _categories = await _service.getCategoriesByTheme(theme);
    notifyListeners();
  }

  // ক্যাটাগরি সিলেক্ট করলে সাব-ক্যাটাগরি এবং সার্ভিস ফিল্টার করা
  Future<void> selectCategory(String categoryId) async {
    _selectedCategoryId = categoryId;
    _selectedSubCategoryId = null; // নতুন ক্যাটাগরি নিলে সাব-ক্যাটাগরি রিসেট
    _subCategories = [];
    
    notifyListeners();
    
    await Future.wait([
      _loadSubCategories(categoryId),
      fetchFilteredServices(),
    ]);
  }

  Future<void> _loadSubCategories(String categoryId) async {
    _subCategories = await _service.getSubCategories(categoryId);
    notifyListeners();
  }

  // সাব-ক্যাটাগরি সিলেক্ট করা
  Future<void> selectSubCategory(String subCategoryId) async {
    _selectedSubCategoryId = subCategoryId;
    notifyListeners();
    await fetchFilteredServices();
  }

  // ফিল্টার অনুযায়ী সার্ভিস ফেচ করা
  Future<void> fetchFilteredServices() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _services = await _service.fetchServices(
        theme: _selectedTheme,
        categoryId: _selectedCategoryId,
        subCategoryId: _selectedSubCategoryId,
      );
    } catch (e) {
      print(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // ফিল্টার রিসেট করা
  void resetFilters() {
    _selectedTheme = null;
    _selectedCategoryId = null;
    _selectedSubCategoryId = null;
    _categories = [];
    _subCategories = [];
    fetchFilteredServices();
  }
}
```

> [!TIP]
> **Sub-category dependency**: প্রফেশনাল সার্ভিস ক্রিয়েশন ফর্মে আগে থিম সিলেক্ট না করা পর্যন্ত ক্যাটাগরি ড্রপডাউন এবং ক্যাটাগরি সিলেক্ট না করা পর্যন্ত সাব-ক্যাটাগরি ড্রপডাউনটি ডিসেবল করে রাখা ভালো।
