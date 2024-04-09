import pandas as pd
from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import learning_curve
from sklearn.ensemble import RandomForestRegressor

# Load the training dataset
train_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\train_set.csv')

# Separate features and target variable for training set
X_train = train_data.drop(columns=['total_crimes'])
y_train = train_data['total_crimes']

# Train the model with K = 5
best_knn_regressor = KNeighborsRegressor(n_neighbors=5, metric='cosine')
best_knn_regressor.fit(X_train, y_train)

# Predict on the training data
y_train_pred = best_knn_regressor.predict(X_train)

# Calculate Mean Squared Error (MSE) for training set
mse_train = mean_squared_error(y_train, y_train_pred)
print("Training Set Metrics:")
print("Mean Squared Error (MSE):", mse_train)

# Calculate Root Mean Squared Error (RMSE) for training set
rmse_train = np.sqrt(mse_train)
print("Root Mean Squared Error (RMSE):", rmse_train)

# Calculate Mean Absolute Error (MAE) for training set
mae_train = mean_absolute_error(y_train, y_train_pred)
print("Mean Absolute Error (MAE):", mae_train)

# Calculate R-squared (R2) for training set
r2_train = r2_score(y_train, y_train_pred)
print("R-squared (R2):", r2_train)

# Calculate correlation coefficient (R) for training set
corr_coef_train = np.corrcoef(y_train, y_train_pred)[0, 1]
print("Correlation Coefficient (R):", corr_coef_train)

# Load the test dataset
test_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\test_set.csv')

# Separate features and target variable for testing set
X_test = test_data.drop(columns=['total_crimes'])
y_test = test_data['total_crimes']

# Predict on the test data
y_pred = best_knn_regressor.predict(X_test)

# Calculate Mean Squared Error (MSE) for testing set
mse = mean_squared_error(y_test, y_pred)
print("\nTesting Set Metrics:")
print("Mean Squared Error (MSE):", mse)

# Calculate Root Mean Squared Error (RMSE) for testing set
rmse = np.sqrt(mse)
print("Root Mean Squared Error (RMSE):", rmse)

# Calculate Mean Absolute Error (MAE) for testing set
mae = mean_absolute_error(y_test, y_pred)
print("Mean Absolute Error (MAE):", mae)

# Calculate R-squared (R2) for testing set
r2 = r2_score(y_test, y_pred)
print("R-squared (R2):", r2)

# Calculate correlation coefficient (R) for testing set
corr_coef = np.corrcoef(y_test, y_pred)[0, 1]
print("Correlation Coefficient (R):", corr_coef)

# Plotting Actual vs Predicted Values (Test Set)
plt.figure(figsize=(10, 5))
plt.scatter(y_test, y_pred, color='blue', alpha=0.5, label='Actual vs Predicted Values')
plt.plot([min(y_test), max(y_test)], [min(y_test), max(y_test)], linestyle='--', color='red', label='Perfect Prediction Line')
plt.title('Actual vs Predicted Values (Test Set)')
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.grid(True)
plt.legend()
plt.show()

# Residual Plot
plt.figure(figsize=(10, 5))
residuals = y_test - y_pred
plt.scatter(y_pred, residuals, color='blue', alpha=0.5)
plt.axhline(y=0, color='red', linestyle='--')
plt.title('Residual Plot')
plt.xlabel('Predicted Values')
plt.ylabel('Residuals')
plt.grid(True)
plt.show()

# Learning Curve
train_sizes, train_scores, test_scores = learning_curve(best_knn_regressor, X_train, y_train, cv=5, scoring='neg_mean_squared_error', n_jobs=-1)
train_scores_mean = -np.mean(train_scores, axis=1)
test_scores_mean = -np.mean(test_scores, axis=1)

plt.figure(figsize=(10, 5))
plt.plot(train_sizes, train_scores_mean, 'o-', color="r", label="Training error")
plt.plot(train_sizes, test_scores_mean, 'o-', color="g", label="Cross-validation error")
plt.title("Learning Curve")
plt.xlabel("Training examples")
plt.ylabel("Error")
plt.legend(loc="best")
plt.grid(True)
plt.show()

# Feature Importance Plot
rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
rf_regressor.fit(X_train, y_train)

# Get feature importances
feature_importances = rf_regressor.feature_importances_

# Get feature names
feature_names = X_train.columns

# Sort feature importances in descending order
indices = feature_importances.argsort()[::-1]

# Plot
plt.figure(figsize=(10, 5))
plt.title("Feature Importances")
plt.bar(range(X_train.shape[1]), feature_importances[indices], align="center")
plt.xticks(range(X_train.shape[1]), feature_names[indices], rotation=90)
plt.xlabel("Features")
plt.ylabel("Importance")
plt.tight_layout()
plt.show()

# Calculate residuals
residuals = y_test - y_pred

# Plot distribution of residuals
plt.figure(figsize=(10, 5))
plt.hist(residuals, bins=20, color='blue', alpha=0.5)
plt.title('Distribution of Residuals')
plt.xlabel('Residuals')
plt.ylabel('Frequency')
plt.grid(True)
plt.show()