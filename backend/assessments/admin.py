from django.contrib import admin
from .models import Question, Answer, UserAttempt, UserResponse, Survey, SurveyQuestion, SurveyChoice, SurveyResponse, SurveyAnswer

class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 2

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'lesson', 'question_type', 'points', 'order')
    list_filter = ('question_type', 'lesson')
    search_fields = ('question_text', 'lesson__title')
    inlines = [AnswerInline]
    ordering = ('lesson', 'order')

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('answer_text', 'question', 'is_correct')
    list_filter = ('is_correct',)
    search_fields = ('answer_text', 'question__question_text')

@admin.register(UserAttempt)
class UserAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'score', 'max_score', 'passed', 'attempt_date')
    search_fields = ('user__email', 'lesson__title')
    list_filter = ('passed', 'attempt_date')

@admin.register(UserResponse)
class UserResponseAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question', 'selected_answer', 'is_correct')
    search_fields = ('attempt__user__email', 'question__question_text')

admin.site.register(Survey)
admin.site.register(SurveyQuestion)
admin.site.register(SurveyChoice)
admin.site.register(SurveyResponse)
admin.site.register(SurveyAnswer)
