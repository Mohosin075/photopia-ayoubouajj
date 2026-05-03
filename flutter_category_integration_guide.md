# Flutter Category System Integration Guide 🚀

এই ডকুমেন্টটিতে Photopya প্রোজেক্টের **Category System**-কে কিভাবে Flutter অ্যাপের সাথে ইন্টিগ্রেট করবেন তার বিস্তারিত গাইডলাইন দেওয়া হলো। এখানে ক্যাটাগরি ফেচ করা থেকে শুরু করে সার্ভিস ফিল্টারিং পর্যন্ত সব কাভার করা হয়েছে।

---

## ১. ডেটা মডেল তৈরি করা (Data Models)

প্রথমে আমাদের ক্যাটাগরি এবং সার্ভিসের জন্য Dart মডেল তৈরি করতে হবে। এগুলো ব্যাকএন্ডের Mongoose ইন্টারফেসের সাথে সামঞ্জস্যপূর্ণ।

### **Category Model**
`parent` ক্যাটাগরি এবং সাব-ক্যাটাগরি হ্যান্ডেল করার জন্য এই মডেলটি ব্যবহার করুন।

```dart
class CategoryModel {
  final String id;
  final String name;
  final String? description;
  final String? image;
  final String? icon;
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

ক্যাটাগরি লিস্ট পেতে এবং সার্ভিস ফিল্টার করতে নিচের এপিআইগুলো ইন্টিগ্রেট করুন।

### **Category API Service**

```dart
class CategoryService {
  final Dio _dio = Dio(BaseOptions(baseUrl: BASE_URL));

  // সব ক্যাটাগরি লিস্ট ফেচ করা
  Future<List<CategoryModel>> getAllCategories() async {
    try {
      final response = await _dio.get('/api/v1/category');
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

যখন একজন প্রফেশনাল কোনো সার্ভিস তৈরি করবেন, তখন তাকে অবশ্যই একটি **Category** এবং (ঐচ্ছিক) **Sub-Category** সিলেক্ট করতে হবে।

### **স্টেপস:**

1. অ্যাপে ক্যাটাগরি ড্রপডাউন দেখানোর জন্য `getAllCategories()` কল করুন যেখানে `type == 'category'`।
2. ইউজার ক্যাটাগরি সিলেক্ট করলে, ঐ ক্যাটাগরির আন্ডারে থাকা সাব-ক্যাটাগরিগুলো ফিল্টার করুন (অথবা `parent == selectedCategoryId` দিয়ে API কল করুন)।
3. সার্ভিস পোস্ট করার সময় নিচের পেলোড ব্যবহার করুন:

```json
{
  "title": "Professional Portraits",
  "category": "651a...abc1", // Category ID
  "subCategory": "651a...abc2", // Sub-category ID (Optional)
  "price": 500,
  "pricingType": "HOURLY",
  // ... other fields
}
```

---

---

## ২.১ সাব-ক্যাটাগরি ফেচ করা (Fetching Sub-categories)

ব্যাকএন্ডে কোনো নির্দিষ্ট ক্যাটাগরির সাব-ক্যাটাগরি পেতে হলে `parent` কুয়েরি প্যারামিটার ব্যবহার করতে হয়।

```dart
Future<List<CategoryModel>> getSubCategories(String parentCategoryId) async {
  try {
    final response = await _dio.get(
      '/api/v1/category',
      queryParameters: {
        'parent': parentCategoryId,
        'type': 'subcategory',
      },
    );
    List data = response.data['data']['data'];
    return data.map((json) => CategoryModel.fromJson(json)).toList();
  } catch (e) {
    rethrow;
  }
}
```

---

## ৪. সার্ভিস ফিল্টারিং (Service Filtering)

সার্ভিস ফিল্টার করার সময় সবচেয়ে বড় ভুল হয় **ID**-এর পরিবর্তে **Name** পাঠানো অথবা কি-এর (Key) নাম ভুল হওয়া।

### **গুরুত্বপূর্ণ কি-পলিমি:**
- **Category ID**: ফিল্টার কি হবে `category`
- **Sub-category ID**: ফিল্টার কি হবে `subCategory` (অবশ্যই CamelCase - বড় হাতের 'C' হবে)।
- **Value**: সবসময় MongoDB **_id** ব্যবহার করবেন।

### **ডাইনামিক ফিল্টারিং লজিক (Dart Example):**

এই ফাংশনটি দিয়ে আপনি ক্যাটাগরি, সাব-ক্যাটাগরি অথবা উভয় দিয়ে ফিল্টার করতে পারবেন।

```dart
Future<List<ServiceModel>> fetchServices({
  String? categoryId,
  String? subCategoryId,
  String? searchTerm,
}) async {
  try {
    // ডাইনামিক কুয়েরি অবজেক্ট তৈরি করা
    Map<String, dynamic> query = {};
    
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

### **Reset Filtering:**
ফিল্টার রিসেট করতে বা সব সার্ভিস দেখতে চাইলে কুয়েরি অবজেক্ট খালি করে পাঠান অথবা ফাংশন প্যারামিটারে `null` পাস করুন।

```dart
// সব সার্ভিস দেখানোর জন্য
fetchServices(); 
```

---

## ৫. UI ইমপ্লিমেন্টেশন টিপস (UI Tips)

### **Home Screen Tab Bar**
হোম স্ক্রিনে একটি হরিজন্টাল লিস্ট ভিউ ব্যবহার করে সব ক্যাটাগরি দেখান। ইউজার যখন কোনো ক্যাটাগরিতে ক্লিক করবেন:
1. ঐ ক্যাটাগরি আইডিটি `currentCategoryId` হিসেবে সেভ করুন।
2. `fetchServicesByCategory(currentCategoryId)` কল করে নিচের সার্ভিস লিস্ট আপডেট করুন।

### **State Management (Provider/Riverpod)**
অ্যাপে ক্যাটাগরি লিস্ট বারবার ফেচ না করে একটি Global State-এ স্টোর করে রাখুন। এতে অ্যাপ ফাস্ট হবে এবং ইউজার এক্সপেরিয়েন্স ভালো হবে।

> [!TIP]
> **Sub-category dependency**: প্রফেশনাল সার্ভিস ক্রিয়েশন ফর্মে ক্যাটাগরি সিলেক্ট না করা পর্যন্ত সাব-ক্যাটাগরি ড্রপডাউনটি ডিসেবল করে রাখা ভালো।

---

---

## ৬. Provider দিয়ে স্টেট ম্যানেজমেন্ট (State Management with Provider)

অ্যাপের বিভিন্ন জায়গায় ক্যাটাগরি এবং সার্ভিসের ডেটা ম্যানেজ করার জন্য `Provider` ব্যবহার করা সবচেয়ে ভালো প্র্যাকটিস। নিচে একটি কম্প্লিট `CategoryProvider`-এর উদাহরণ দেওয়া হলো।

### **CategoryProvider ইমপ্লিমেন্টেশন:**

```dart
import 'package:flutter/material.dart';

class CategoryProvider with ChangeNotifier {
  final CategoryService _service = CategoryService();
  
  List<CategoryModel> _categories = [];
  List<CategoryModel> _subCategories = [];
  List<ServiceModel> _services = [];
  
  String? _selectedCategoryId;
  String? _selectedSubCategoryId;
  bool _isLoading = false;

  // Getters
  List<CategoryModel> get categories => _categories;
  List<CategoryModel> get subCategories => _subCategories;
  List<ServiceModel> get services => _services;
  bool get isLoading => _isLoading;
  String? get selectedCategoryId => _selectedCategoryId;

  // সব ক্যাটাগরি লোড করা (App Start-এ একবার)
  Future<void> fetchInitialCategories() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _categories = await _service.getAllCategories();
    } catch (e) {
      print(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ক্যাটাগরি সিলেক্ট করলে সাব-ক্যাটাগরি এবং সার্ভিস ফিল্টার করা
  Future<void> selectCategory(String categoryId) async {
    _selectedCategoryId = categoryId;
    _selectedSubCategoryId = null; // নতুন ক্যাটাগরি নিলে সাব-ক্যাটাগরি রিসেট
    _subCategories = [];
    
    notifyListeners();
    
    // সাথে সাথে সাব-ক্যাটাগরি এবং ঐ ক্যাটাগরির সার্ভিস নিয়ে আসা
    await Future.wait([
      _loadSubCategories(categoryId),
      fetchFilteredServices(),
    ]);
  }

  Future<void> _loadSubCategories(String categoryId) async {
    _subCategories = await _service.getSubCategories(categoryId);
    notifyListeners();
  }

  // ফিল্টার অনুযায়ী সার্ভিস ফেচ করা
  Future<void> fetchFilteredServices() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _services = await _service.fetchServices(
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
    _selectedCategoryId = null;
    _selectedSubCategoryId = null;
    _subCategories = [];
    fetchFilteredServices();
  }
}
```

### **UI-তে ব্যবহার করার নিয়ম:**

১. **App Wrap করা (main.dart):**
```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => CategoryProvider()..fetchInitialCategories()),
  ],
  child: MyApp(),
)
```

২. **Screen-এ ডেটা দেখানো:**
```dart
Consumer<CategoryProvider>(
  builder: (context, provider, child) {
    if (provider.isLoading) return CircularProgressIndicator();
    
    return ListView.builder(
      itemCount: provider.services.length,
      itemBuilder: (context, index) {
        final service = provider.services[index];
        return ServiceCard(service: service);
      },
    );
  },
)
```

৩. **সিলেকশন হ্যান্ডেল করা:**
```dart
onTap: () {
  context.read<CategoryProvider>().selectCategory(category.id);
}
```

---

> [!TIP]
> **Performance Tip**: `fetchInitialCategories()` শুধুমাত্র একবার কল করুন। সাব-ক্যাটাগরিগুলো ক্যাশ করে রাখতে পারেন যাতে প্রতিবার ক্যাটাগরি স্লাইড করলে আবার এপিআই কল না হয়।

যদি আরও স্পেসিফিক কোনো UI পার্ট (যেমন Dropdown বা TabBar) প্রোভাইডার দিয়ে দেখতে চান, তবে জানাবেন! 
