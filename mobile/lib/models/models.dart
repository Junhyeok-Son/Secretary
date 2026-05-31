class Event {
  final String id;
  final String title;
  final String? description;
  final DateTime startAt;
  final DateTime endAt;
  final String? location;
  final String status;

  Event({
    required this.id,
    required this.title,
    this.description,
    required this.startAt,
    required this.endAt,
    this.location,
    required this.status,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      startAt: DateTime.parse(json['start_at'] as String),
      endAt: DateTime.parse(json['end_at'] as String),
      location: json['location'] as String?,
      status: json['status'] as String? ?? 'confirmed',
    );
  }
}

class ChatMessage {
  final String id;
  final String role; // 'user' | 'assistant'
  String content;
  bool pending;

  ChatMessage({
    required this.id,
    required this.role,
    this.content = '',
    this.pending = false,
  });
}
