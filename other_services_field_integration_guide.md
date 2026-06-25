# 🛠️ Add-On Integration Guide: Adding `otherServices` to your Flutter App

This guide explains how to add the new **`otherServices`** field to your existing Flutter codebase. Since your app is already fully integrated, you only need to insert the following snippets into your existing Model, Form/State Management, and UI screens.

---

## 1. Update the Model (`service_model.dart` or similar)

Locate your existing `ServiceModel` class and add the new `otherServices` field to its constructor, `fromJson` parser, and `toJson` serializer.

```diff
class ServiceModel {
  final String id;
  final String title;
  // ... other existing fields ...
+ final List<String> otherServices; 

  ServiceModel({
    required this.id,
    required this.title,
    // ... other existing fields ...
+   required this.otherServices,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['_id'] as String,
      title: json['title'] as String,
      // ... other existing fields ...
+     otherServices: List<String>.from(json['otherServices'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      // ... other existing fields ...
+     'otherServices': otherServices,
    };
  }
}
```

---

## 2. Update the Create/Edit Controller or State (`service_form_controller.dart` or similar)

In the state or controller where you manage form inputs and send request bodies:

```dart
// 1. Declare a list to store other service names in your state/controller:
List<String> selectedOtherServices = [];

// 2. When submitting the form, ensure 'otherServices' is added to the request payload:
Map<String, dynamic> requestBody = {
  "title": titleController.text,
  "category": selectedCategoryId,
  "subCategory": selectedSubCategoryId,
  "basePrice": double.parse(priceController.text),
  "pricingType": selectedPricingType,
  // ... other existing fields ...
  
  // ADD THIS LINE:
  "otherServices": selectedOtherServices,
};
```

---

## 3. Update the Creation/Editing UI Form (`create_service_screen.dart`)

Add a Text Field and a list of Chips to let providers add and delete secondary service names.

### A. State Variables & Text Controller
Add these to your State class:
```dart
final TextEditingController _otherServiceInputController = TextEditingController();
List<String> _otherServicesList = [];
```

### B. Add this Widget inside your form's `Column` or `ListView`:
Place this widget where you want the "Other Services" field to appear (e.g., under the tags or description field):

```dart
Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    const Text(
      "Other Services Offered (Optional)",
      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
    ),
    const SizedBox(height: 8),
    Row(
      children: [
        Expanded(
          child: TextFormField(
            controller: _otherServiceInputController,
            decoration: const InputDecoration(
              hintText: "e.g. Drone photography, Photo editing",
              border: OutlineInputBorder(),
            ),
          ),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          onPressed: () {
            final text = _otherServiceInputController.text.trim();
            if (text.isNotEmpty && !_otherServicesList.contains(text)) {
              setState(() {
                _otherServicesList.add(text);
                _otherServiceInputController.clear();
              });
            }
          },
          child: const Text("Add"),
        ),
      ],
    ),
    const SizedBox(height: 8),
    // Render the added services as dismissible chips
    Wrap(
      spacing: 8.0,
      runSpacing: 4.0,
      children: _otherServicesList.map((serviceName) {
        return Chip(
          label: Text(serviceName),
          backgroundColor: Colors.blue.shade50,
          deleteIcon: const Icon(Icons.close, size: 16, color: Colors.blue),
          onDeleted: () {
            setState(() {
              _otherServicesList.remove(serviceName);
            });
          },
        );
      }).toList(),
    ),
  ],
)
```

---

## 4. Update the Details Screen (`service_detail_screen.dart`)

Display the list of other services as a set of static Chips on the service details screen.

### A. Insert this widget in your Detail Screen layout:
Place this under the category/subcategory badges or the main description:

```dart
// Check if the list is not empty before rendering
if (service.otherServices.isNotEmpty) ...[
  const SizedBox(height: 16),
  const Text(
    "Other Services Offered:",
    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
  ),
  const SizedBox(height: 8),
  Wrap(
    spacing: 8.0,
    runSpacing: 8.0,
    children: service.otherServices.map((serviceName) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.indigo.shade50,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.indigo.shade100),
        ),
        child: Text(
          serviceName,
          style: TextStyle(
            color: Colors.indigo.shade700,
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      );
    }).toList(),
  ),
]
```
