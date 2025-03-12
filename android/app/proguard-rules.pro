# Оставляем Java и Kotlin классы нетронутыми
-keep class java.nio.** { *; }
-keep class java.util.** { *; }
-keep class java.lang.** { *; }
-keep class kotlin.** { *; }

# Игнорируем предупреждения
-dontwarn java.nio.**
-dontwarn java.util.**
-dontwarn java.lang.**
-dontwarn kotlin.**

# Включаем поддержку desugaring
-keep class j$.** { *; }
-dontwarn j$.**

# Пропускаем ошибки от R8
-ignorewarnings
