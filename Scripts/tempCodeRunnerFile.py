    for area in df['area'].unique():
        area_data = df[df['area'] == area]
        plt.figure(figsize=(14, 8))  # Larger image size
        for idx, crime_description in enumerate(sorted(area_data['crime_description'].unique())):
            crime_data = area_data[area_data['crime_description'] == crime_description]
            color = color_cycle[idx % len(color_cycle)]  # Loop over colors
            plt.plot(crime_data['year'], crime_data['crime_count'], label=crime_description, color=color)
            
            # Fit a polynomial regression line (degree 1) to the data points excluding 2019
            mask = crime_data['year'] < 2019
            z = np.polyfit(crime_data['year'][mask], crime_data['crime_count'][mask], 1)
            p = np.poly1d(z)
            plt.plot(crime_data['year'], p(crime_data['year']), '--', color=color)  # Dotted trend line
            
            # Predict crime count for 2019 using the trend line
            predicted_count_2019 = p(2019)
            plt.scatter(2019, predicted_count_2019, color='black', marker='o')  # Mark predicted value for 2019
        
        plt.title(f'Crime Categories in Area {area}')
        plt.xlabel('Year')
        plt.ylabel('Crime Count')
        plt.xticks(range(2010, 2020))  # Ensure years span from 2010 to 2019
        plt.legend(loc='center left', bbox_to_anchor=(1.05, 0.5), borderaxespad=0)  # Place legend on the side and adjust bbox
        plt.grid(True)
        
        # Save the plot to the area graphs folder
        plt.savefig(os.path.join(area_graphs_folder, f'Area_{area}_Crime_Graph.png'), bbox_inches='tight')  # Adjust bounding box to include legend
        
        # Close the plot to release memory
        plt.close()